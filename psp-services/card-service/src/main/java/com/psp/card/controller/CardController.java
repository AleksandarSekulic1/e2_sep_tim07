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

    // URL Banke (ovo ćemo napraviti u sledećem koraku, za sad neka stoji ovako)
    // Ako nemaš Bank servis još, ovaj deo će pucati, ali to je OČEKIVANO dok ne dignemo banku.
    private final String BANK_SERVICE_URL = "http://localhost:8085/api/bank/request-payment-url";

    @PostMapping("/pay")
    public ResponseEntity<?> initiateCardPayment(@RequestBody CardPaymentRequest request) {
        
        System.out.println("---------------------------------------------");
        System.out.println("CARD SERVICE - INICIJALIZACIJA KA BANCI:");
        System.out.println("Transakcija ID: " + request.getMerchantOrderId());

        // Priprema podataka za Banku (Tabela 2 iz specifikacije)
        Map<String, Object> bankRequest = new HashMap<>();
        bankRequest.put("merchantId", "PSP_CLIENT_ID_123"); // ID koji nam je banka dala
        bankRequest.put("amount", request.getAmount());
        bankRequest.put("currency", request.getCurrency());
        bankRequest.put("merchantOrderId", request.getMerchantOrderId()); // STAN
        bankRequest.put("merchantTimestamp", LocalDateTime.now().toString());

        try {
            // Šaljemo zahtev Banci da nam da URL
            ResponseEntity<Map> bankResponse = restTemplate.postForEntity(BANK_SERVICE_URL, bankRequest, Map.class);
            
            System.out.println("✅ Dobijen URL od Banke: " + bankResponse.getBody().get("paymentUrl"));
            
            // Vraćamo Frontendu URL Banke
            return ResponseEntity.ok(bankResponse.getBody());

        } catch (Exception e) {
            System.out.println("❌ GREŠKA: Banka nije dostupna (Da li je pokrenut Bank Service?).");
            // Privremeno vraćamo grešku dok ne napravimo Bank servis
            return ResponseEntity.status(500).body("Greška u komunikaciji sa bankom");
        }
    }
}