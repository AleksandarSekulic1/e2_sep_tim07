package com.bank.controller;

import com.bank.dto.PaymentUrlRequest;
import com.bank.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/bank")
public class BankController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/request-payment-url")
    public ResponseEntity<?> generatePaymentUrl(@RequestBody PaymentUrlRequest request) {
        try {
            return ResponseEntity.ok(paymentService.createPaymentSession(request));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PostMapping("/pay")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> paymentData) {
        String orderId = (String) paymentData.get("merchantOrderId");
        
        if (paymentService.isOrderProcessed(orderId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("ALREADY_PROCESSED");
        }

        String pan = (String) paymentData.get("pan");
        String expiry = (String) paymentData.get("expiryDate");
        String cvv = (String) paymentData.get("cvv");
        Double amount = Double.valueOf(paymentData.get("amount").toString());

        // Provera validnosti kartice
        String validationResult = paymentService.validateCard(pan, expiry, cvv);
        if (!"VALID".equals(validationResult)) {
            paymentService.notifyPsp(orderId, "FAILED", null, validationResult);
            paymentService.markAsProcessed(orderId);
            return ResponseEntity.badRequest().body(validationResult);
        }

        // Provera sredstava
        if (amount > 20000) {
            paymentService.notifyPsp(orderId, "FAILED", null, "INSUFFICIENT_FUNDS");
            paymentService.markAsProcessed(orderId);
            return ResponseEntity.badRequest().body("INSUFFICIENT_FUNDS");
        }

        // Uspešno plaćanje
        String globalId = UUID.randomUUID().toString();
        paymentService.notifyPsp(orderId, "PAID", globalId, null);
        paymentService.markAsProcessed(orderId);

        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("globalTransactionId", globalId);
        return ResponseEntity.ok(response);
    }
}