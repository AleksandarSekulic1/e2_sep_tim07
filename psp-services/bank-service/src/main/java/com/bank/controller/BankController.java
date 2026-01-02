package com.bank.controller;

import com.bank.dto.PaymentUrlRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bank")
public class BankController {

    @Autowired
    private RestTemplate restTemplate; // Mora biti Autowired

    @PostMapping("/request-payment-url")
    public ResponseEntity<?> generatePaymentUrl(@RequestBody PaymentUrlRequest request) {
        System.out.println("🏦 BANKA: Zahtev za URL, transakcija: " + request.getMerchantOrderId());
        
        String paymentId = UUID.randomUUID().toString();
        String paymentUrl = "http://localhost:4200/bank-payment/" + paymentId + 
                            "?amount=" + request.getAmount() + 
                            "&merchantOrderId=" + request.getMerchantOrderId();

        Map<String, String> response = new HashMap<>();
        response.put("paymentId", paymentId);
        response.put("paymentUrl", paymentUrl);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/pay")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> paymentData) {
        String pan = (String) paymentData.get("pan");
        Double amount = Double.valueOf(paymentData.get("amount").toString());
        String merchantOrderId = (String) paymentData.get("merchantOrderId");

        // GENERIŠEMO GLOBALNI ID OVDE DA BI GA POSLALI CORE SERVISU
        String globalId = UUID.randomUUID().toString();

        System.out.println("🏦 BANKA: Obrada za ID: " + merchantOrderId + " | Iznos: " + amount);

        if (!luhnCheck(pan)) {
            return ResponseEntity.badRequest().body("Neispravan broj kartice");
        }

        if (amount > 20000) {
            return ResponseEntity.badRequest().body("Nedovoljno sredstava");
        }

        System.out.println("✅ BANKA: Transakcija uspešna! Obaveštavam Core servis...");

        try {
            String coreUrl = "http://localhost:8081/transactions/update-status/" + merchantOrderId;
            
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("status", "PAID");
            statusUpdate.put("globalTransactionId", globalId); // Sada koristimo generisani globalId
            statusUpdate.put("acquirerTimestamp", LocalDateTime.now().toString());
            statusUpdate.put("merchantOrderId", merchantOrderId); 

            restTemplate.put(coreUrl, statusUpdate);
            System.out.println("📞 BANKA -> CORE: Poslato: Status=PAID, GlobalID=" + globalId);

        } catch (Exception e) {
            System.err.println("⚠️ Greška pri javljanju Core servisu: " + e.getMessage());
        }

        Map<String, String> successResponse = new HashMap<>();
        successResponse.put("status", "SUCCESS");
        return ResponseEntity.ok(successResponse);
    }

    private boolean luhnCheck(String cardNo) {
        if (cardNo == null) return false;
        String cleanPan = cardNo.replaceAll("\\s+", "");
        int nSum = 0;
        boolean isSecond = false;
        for (int i = cleanPan.length() - 1; i >= 0; i--) {
            int d = cleanPan.charAt(i) - '0';
            if (isSecond) d = d * 2;
            nSum += d / 10;
            nSum += d % 10;
            isSecond = !isSecond;
        }
        return (nSum % 10 == 0);
    }
}