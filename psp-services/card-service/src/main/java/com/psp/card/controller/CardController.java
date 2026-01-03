package com.psp.card.controller;

import com.psp.card.dto.CardPaymentRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/cards")
public class CardController {

    @Autowired
    private RestTemplate restTemplate;

    private final String BANK_SERVICE_URL = "http://localhost:8085/api/bank/request-payment-url";
    
    // Putanja do Core servisa (8081). 
    // VAŽNO: Proveri da li tvoj TransactionController ima @PutMapping("/update-method/{id}")
    private final String CORE_SERVICE_UPDATE_URL = "http://localhost:8081/transactions/update-method/";

    @PostMapping("/pay")
    public ResponseEntity<?> initiateCardPayment(@RequestBody CardPaymentRequest request) {
        
        if (request.getPspTransactionId() == null) {
        System.out.println("❌ GREŠKA: Stigao je NULL pspTransactionId sa frontenda!");
        return ResponseEntity.badRequest().body("Greška: pspTransactionId ne sme biti null");
    }
    
        System.out.println("---------------------------------------------");
        System.out.println("CARD SERVICE - START");
        System.out.println("Ažuriranje metode za PSP ID: " + request.getPspTransactionId());

        // KORAK 1: ODMAH šaljemo signal Core servisu da upiše "CARD" u bazu.
        // Ovo radimo pre poziva banke da bi se na frontendu odmah pojavio bedž.
        try {
            Map<String, String> updateRequest = new HashMap<>();
            updateRequest.put("method", "CARD");
            
            // Koristimo put() da bismo pogodili @PutMapping u Core servisu
            restTemplate.put(CORE_SERVICE_UPDATE_URL + request.getPspTransactionId(), updateRequest);
            
            System.out.println("✅ CORE USPEŠNO OBAVEŠTEN: Metoda CARD je upisana.");
        } catch (Exception e) {
            // Logujemo grešku ali ne prekidamo proces (možda je samo Core servis spor)
            System.out.println("⚠️ GREŠKA PRI UPISU METODE: " + e.getMessage());
        }

        // KORAK 2: Priprema i slanje zahteva Banci (Acquirer-u)
        Map<String, Object> bankRequest = new HashMap<>();
        bankRequest.put("merchantId", "PSP_CLIENT_ID_123");
        bankRequest.put("amount", request.getAmount());
        bankRequest.put("currency", request.getCurrency());
        bankRequest.put("merchantOrderId", request.getMerchantOrderId());
        bankRequest.put("merchantTimestamp", LocalDateTime.now().toString());

        try {
            System.out.println("🚀 Šaljem zahtev Banci na: " + BANK_SERVICE_URL);
            ResponseEntity<Map> bankResponse = restTemplate.postForEntity(BANK_SERVICE_URL, bankRequest, Map.class);
            
            System.out.println("✅ BANKA ODGOVORILA: URL dobijen.");
            // Vraćamo paymentUrl frontendu koji će uraditi redirekciju
            return ResponseEntity.ok(bankResponse.getBody());

        } catch (Exception e) {
            System.out.println("❌ BANKA NEDOSTUPNA: Proveri Bank Service (8085)");
            return ResponseEntity.status(500).body("Greška u komunikaciji sa bankom: " + e.getMessage());
        }
    }
}