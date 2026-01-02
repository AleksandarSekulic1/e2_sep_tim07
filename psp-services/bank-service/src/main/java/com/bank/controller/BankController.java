package com.bank.controller;

import com.bank.dto.PaymentUrlRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bank")
//@CrossOrigin(origins = "*") // Dozvoljavamo pristup sa Frontenda
public class BankController {

    // 1. KORAK: Generisanje URL-a (To već imamo i radi)
    @PostMapping("/request-payment-url")
    public ResponseEntity<?> generatePaymentUrl(@RequestBody PaymentUrlRequest request) {
        System.out.println("🏦 BANKA: Zahtev za URL, transakcija: " + request.getMerchantOrderId());
        
        String paymentId = UUID.randomUUID().toString();
        // URL ka tvom Angular Bank ekranu
        String paymentUrl = "http://localhost:4200/bank-payment/" + paymentId + "?amount=" + request.getAmount();
        Map<String, String> response = new HashMap<>();
        response.put("paymentId", paymentId);
        response.put("paymentUrl", paymentUrl);

        return ResponseEntity.ok(response);
    }

    // --- NOVO: 2. KORAK: Obrada plaćanja (Kada klikneš "POTVRDI PLAĆANJE") ---
    @PostMapping("/pay")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> paymentData) {
        String pan = (String) paymentData.get("pan");
        String cardHolder = (String) paymentData.get("cardHolder");
        // Pazimo na tipove podataka (JSON brojevi mogu biti Integer ili Double)
        Double amount = Double.valueOf(paymentData.get("amount").toString());

        System.out.println("🏦 BANKA: Obrada plaćanja za: " + cardHolder + " | Iznos: " + amount);
        System.out.println("💳 PAN: " + pan);

        // A) Provera Lunovog algoritma
        if (!luhnCheck(pan)) {
            System.out.println("❌ BANKA: Neispravan broj kartice (Lun test neuspešan)");
            return ResponseEntity.badRequest().body("Neispravan broj kartice (Lun test failed)");
        }

        // B) Provera sredstava (Hardkodovano pravilo: Ako je iznos > 20000, odbij)
        if (amount > 20000) {
            System.out.println("❌ BANKA: Nedovoljno sredstava na računu");
            return ResponseEntity.badRequest().body("Nedovoljno sredstava");
        }

        // C) Uspeh
        System.out.println("✅ BANKA: Transakcija uspešna!");
        Map<String, String> successResponse = new HashMap<>();
        successResponse.put("status", "SUCCESS");
        successResponse.put("message", "Transakcija odobrena");
        
        return ResponseEntity.ok(successResponse);
    }

    // --- POMOĆNA METODA: Lunov Algoritam ---
    private boolean luhnCheck(String cardNo) {
        if (cardNo == null) return false;
        // Uklanjamo razmake ako ih ima
        String cleanPan = cardNo.replaceAll("\\s+", "");
        
        int nDigits = cleanPan.length();
        int nSum = 0;
        boolean isSecond = false;
        
        for (int i = nDigits - 1; i >= 0; i--) {
            int d = cleanPan.charAt(i) - '0';
            
            if (isSecond)
                d = d * 2;
            
            // Dodajemo zbir cifara (npr. 18 -> 1+8=9)
            nSum += d / 10;
            nSum += d % 10;
            
            isSecond = !isSecond;
        }
        return (nSum % 10 == 0);
    }
}