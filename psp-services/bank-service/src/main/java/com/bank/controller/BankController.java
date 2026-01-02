package com.bank.controller;

import com.bank.dto.PaymentUrlRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate; // <--- OBAVEZNO IMPORTUJ OVO

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
        String paymentUrl = "http://localhost:4200/bank-payment/" + paymentId + 
                            "?amount=" + request.getAmount() + 
                            "&merchantOrderId=" + request.getMerchantOrderId();
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
        Double amount = Double.valueOf(paymentData.get("amount").toString());
        
        // Čitamo ID transakcije koji smo dobili od Frontenda
        String merchantOrderId = (String) paymentData.get("merchantOrderId");

        System.out.println("🏦 BANKA: Obrada za ID: " + merchantOrderId + " | Iznos: " + amount);

        // A) Lunov test (isto kao pre)
        if (!luhnCheck(pan)) {
            return ResponseEntity.badRequest().body("Neispravan broj kartice");
        }

        // B) Provera sredstava (isto kao pre)
        if (amount > 20000) {
            return ResponseEntity.badRequest().body("Nedovoljno sredstava");
        }

        // C) Uspeh - Sada javljamo Core servisu!
        System.out.println("✅ BANKA: Transakcija uspešna! Obaveštavam Core servis...");

        try {
        // MENJAMO PORT SA 8080 NA 8081 (Direktno na Core servis)
        // Takođe proveravamo da li je putanja tačna: /transactions/update-status/
        String coreUrl = "http://localhost:8081/transactions/update-status/" + merchantOrderId;
        
        Map<String, String> statusUpdate = new HashMap<>();
        statusUpdate.put("status", "PAID");

        RestTemplate restTemplate = new RestTemplate();
        // Koristimo .put jer je u TransactionControlleru definisano kao @PutMapping
        restTemplate.put(coreUrl, statusUpdate);
        
        System.out.println("📞 BANKA -> CORE: Obaveštenje poslato direktno na 8081!");

    } catch (Exception e) {
        System.err.println("⚠️ Greška pri javljanju Core servisu: " + e.getMessage());
    }

        // Vraćamo uspeh Frontendu
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