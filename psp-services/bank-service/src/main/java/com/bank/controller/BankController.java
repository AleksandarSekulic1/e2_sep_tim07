package com.bank.controller;

import com.bank.dto.PaymentUrlRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/bank")
public class BankController {

    @Autowired
    private RestTemplate restTemplate;

    // --- NOVO: Validacija PSP-a (Tačka 3.a specifikacije) ---
    // U realnom sistemu ovo bi išlo u bazu, za KT1 je dovoljno kao konstanta
    private static final String VALID_PSP_CLIENT_ID = "PSP_CLIENT_ID_123";

    // Keš memorija za praćenje obrađenih porudžbina (Sprečava višestruke pokušaje)
    private static final java.util.Set<String> processedOrders = ConcurrentHashMap.newKeySet();

    @PostMapping("/request-payment-url")
    public ResponseEntity<?> generatePaymentUrl(@RequestBody PaymentUrlRequest request) {
        // --- IZMENA 1: Validacija MERCHANT_ID parametra (Tačka 3.a) ---
        if (!VALID_PSP_CLIENT_ID.equals(request.getMerchantId())) {
            System.out.println("❌ BANKA: Neautorizovan pristup! Neispravan Merchant ID: " + request.getMerchantId());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Neautorizovan PSP zahtev.");
        }

        System.out.println("🏦 BANKA: Zahtev za URL prihvaćen, transakcija: " + request.getMerchantOrderId());
        
        String paymentId = UUID.randomUUID().toString();
        
        // --- IZMENA 2: Vremensko ograničenje (Tačka 4.a) ---
        // Generišemo timestamp koji ističe za 15 minuta
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(15);

        String paymentUrl = "http://localhost:4200/bank-payment/" + paymentId + 
                            "?amount=" + request.getAmount() + 
                            "&merchantOrderId=" + request.getMerchantOrderId() +
                            "&expiresAt=" + expiryTime.toString(); // Šaljemo i vreme isteka

        Map<String, String> response = new HashMap<>();
        response.put("paymentId", paymentId);
        response.put("paymentUrl", paymentUrl);
        response.put("expiresAt", expiryTime.toString()); // PSP sada zna kada link ističe

        return ResponseEntity.ok(response);
    }

    @PostMapping("/pay")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> paymentData) {
        String merchantOrderId = (String) paymentData.get("merchantOrderId");
        
        // --- PROVERA: Ograničenje na samo jedan pokušaj plaćanja (Tačka 4.a) ---
        if (processedOrders.contains(merchantOrderId)) {
            System.out.println("⚠️ BANKA: Pokušaj ponovnog plaćanja blokiran za ID: " + merchantOrderId);
            return ResponseEntity.status(HttpStatus.CONFLICT)
                                 .body("Ova transakcija je već procesuirana. Jedna forma važi za samo jedan pokušaj.");
        }

        String pan = (String) paymentData.get("pan");
        String expiryDate = (String) paymentData.get("expiryDate");
        String cvv = (String) paymentData.get("cvv");
        Double amount = Double.valueOf(paymentData.get("amount").toString());

        String globalId = UUID.randomUUID().toString();
        System.out.println("🏦 BANKA: Obrada za ID: " + merchantOrderId);

        // 1. Validacija CVV
        if (cvv == null || !cvv.matches("^[0-9]{3}$")) {
            reportFailure(merchantOrderId, "INVALID_CVV");
            return ResponseEntity.badRequest().body("Neispravan CVV");
        }

        // 2. Validacija formata datuma (MM/YY) - Tačka 4.a
        if (expiryDate == null || !expiryDate.matches("(0[1-9]|1[0-2])/[0-9]{2}")) {
            reportFailure(merchantOrderId, "INVALID_DATE_FORMAT");
            return ResponseEntity.badRequest().body("Neispravan format datuma (MM/YY)");
        }

        // 3. Provera da li je kartica istekla
        if (isCardExpired(expiryDate)) {
            reportFailure(merchantOrderId, "CARD_EXPIRED");
            return ResponseEntity.badRequest().body("Kartica je istekla");
        }

        // 4. Validacija PAN-a (Lunova formula) - Tačka 4.a
        if (!luhnCheck(pan)) {
            reportFailure(merchantOrderId, "LUHN_FAILED");
            return ResponseEntity.badRequest().body("Neispravan broj kartice");
        }

        // 5. Provera sredstava (Simulacija)
        if (amount > 20000) {
            reportFailure(merchantOrderId, "INSUFFICIENT_FUNDS");
            return ResponseEntity.badRequest().body("Nedovoljno sredstava na računu");
        }

        // AKO SVE PROĐE - OZNAČAVAMO KAO OBRAĐENO (Tačka 4.a)
        processedOrders.add(merchantOrderId);
        
        try {
            String coreUrl = "http://localhost:8081/transactions/update-status/" + merchantOrderId;
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("status", "PAID");
            
            // --- IZMENA 3: Slanje obaveznih podataka PSP-u (Tačka 5 i 6) ---
            statusUpdate.put("globalTransactionId", globalId);
            statusUpdate.put("acquirerTimestamp", LocalDateTime.now().toString());

            restTemplate.put(coreUrl, statusUpdate);
            System.out.println("📞 BANKA -> CORE: Webhook SUCCESS poslat (GlobalID: " + globalId + ")");
        } catch (Exception e) {
            System.err.println("⚠️ Greška pri javljanju: " + e.getMessage());
        }

        Map<String, String> successResponse = new HashMap<>();
        successResponse.put("status", "SUCCESS");
        successResponse.put("globalTransactionId", globalId);
        return ResponseEntity.ok(successResponse);
    }

    private void reportFailure(String merchantOrderId, String reason) {
        // Označavamo kao obrađeno čak i u slučaju greške - Tačka 4.a
        processedOrders.add(merchantOrderId);
        
        try {
            String coreUrl = "http://localhost:8081/transactions/update-status/" + merchantOrderId;
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("status", "FAILED");
            statusUpdate.put("reason", reason);
            
            restTemplate.put(coreUrl, statusUpdate);
            System.out.println("📞 BANKA -> CORE: Webhook FAILED poslat (" + reason + ")");
        } catch (Exception e) {
            System.err.println("⚠️ Greška pri javljanju neuspeha: " + e.getMessage());
        }
    }

    private boolean luhnCheck(String cardNo) {
    if (cardNo == null) return false;
    String cleanPan = cardNo.replaceAll("\\D", ""); // IZMENA: Briše sve što nije broj
    System.out.println("🔍 PROVERA PAN-a: [" + cleanPan + "] Dužina: " + cleanPan.length());
    
    int nSum = 0;
    boolean isSecond = false;
    for (int i = cleanPan.length() - 1; i >= 0; i--) {
        int d = cleanPan.charAt(i) - '0';
        if (isSecond) d = d * 2;
        nSum += d / 10;
        nSum += d % 10;
        isSecond = !isSecond;
    }
    System.out.println("📊 Finalni zbir: " + nSum + " (Ostatak: " + (nSum % 10) + ")");
    return (nSum % 10 == 0);
}

    private boolean isCardExpired(String expiryDate) {
        try {
            String[] parts = expiryDate.split("/");
            int month = Integer.parseInt(parts[0]);
            int year = Integer.parseInt("20" + parts[1]);
            YearMonth cardExpiry = YearMonth.of(year, month);
            return cardExpiry.isBefore(YearMonth.now());
        } catch (Exception e) {
            return true;
        }
    }
}