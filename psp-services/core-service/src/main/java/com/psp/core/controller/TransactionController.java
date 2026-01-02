package com.psp.core.controller;

import com.psp.core.dto.PaymentRequest;
import com.psp.core.model.Merchant;
import com.psp.core.model.Transaction;
import com.psp.core.repository.MerchantRepository;
import com.psp.core.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @PostMapping("/initiate") 
    public ResponseEntity<?> initiateTransaction(@RequestBody PaymentRequest request) {
        Optional<Merchant> merchantOpt = merchantRepository.findById(request.getMerchantId());

        if (merchantOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nepoznat prodavac");
        }

        Merchant merchant = merchantOpt.get();
        if (!merchant.getMerchantPassword().equals(request.getMerchantPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Pogrešna lozinka");
        }
        
        System.out.println("✅ CORE: AUTH USPEŠAN za " + merchant.getName());

        Transaction transaction = new Transaction();
        transaction.setMerchantId(request.getMerchantId());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setMerchantOrderId(request.getMerchantOrderId());
        
        try {
            transaction.setMerchantTimestamp(LocalDateTime.parse(request.getMerchantTimestamp()));
        } catch (Exception e) {
            transaction.setMerchantTimestamp(LocalDateTime.now());
        }
        
        transaction.setSuccessUrl(request.getSuccessUrl());
        transaction.setFailedUrl(request.getFailedUrl());
        transaction.setErrorUrl(request.getErrorUrl());

        transaction.setStatus("CREATED"); 
        transaction.setPspTimestamp(LocalDateTime.now());
        transaction.setStan(generateStan());

        Transaction savedTransaction = transactionRepository.save(transaction);

        Map<String, Object> response = new HashMap<>();
        response.put("pspTransactionId", savedTransaction.getId());
        response.put("paymentUrl", "http://localhost:4200/payment-methods/" + savedTransaction.getId());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getTransactionDetails(@PathVariable Long id) {
        return ResponseEntity.ok(transactionRepository.findById(id));
    }

    private String generateStan() {
        Random random = new Random();
        int number = random.nextInt(900000) + 100000;
        return String.valueOf(number);
    }

    // --- POPRAVLJEN WEBHOOK PREMA SPECIFIKACIJI ---
    @PutMapping("/update-status/{merchantOrderId}")
    @Transactional
    public ResponseEntity<?> updateTransactionStatus(
            @PathVariable String merchantOrderId, 
            @RequestBody Map<String, Object> statusUpdate) {
        
        String cleanId = merchantOrderId.trim();
        System.out.println("🔔 CORE: Primio zahtev za ažuriranje ID: [" + cleanId + "]");

        // 1. Primarna pretraga po merchant_order_id koloni
        Transaction transaction = transactionRepository.findByMerchantOrderId(cleanId);
        
        // 2. Fallback pretraga (ako je pomešan STAN i ID)
        if (transaction == null) {
            System.out.println("🔎 CORE: merchantOrderId nije upalio, pretražujem bazu po STAN-u/ID-ju...");
            List<Transaction> all = transactionRepository.findAll();
            transaction = all.stream()
                .filter(t -> (t.getMerchantOrderId() != null && t.getMerchantOrderId().equals(cleanId)) || 
                             (t.getStan() != null && t.getStan().equals(cleanId)) ||
                             (t.getId() != null && String.valueOf(t.getId()).equals(cleanId)))
                .findFirst()
                .orElse(null);
        }

        if (transaction != null) {
            String status = (String) statusUpdate.get("status");
            
            if ("SUCCESS".equalsIgnoreCase(status) || "PAID".equalsIgnoreCase(status)) {
                // Ažuriranje statusa
                transaction.setStatus("PAID");

                // Čuvanje Global ID-ja iz Banke (Acquirer)
                if (statusUpdate.containsKey("globalTransactionId")) {
                    transaction.setGlobalTransactionId(statusUpdate.get("globalTransactionId").toString());
                }

                // Čuvanje Acquirer Timestamp-a
                if (statusUpdate.containsKey("acquirerTimestamp")) {
                    try {
                        transaction.setAcquirerTimestamp(LocalDateTime.parse(statusUpdate.get("acquirerTimestamp").toString()));
                    } catch (Exception e) {
                        transaction.setAcquirerTimestamp(LocalDateTime.now());
                    }
                }

                transactionRepository.saveAndFlush(transaction);
                System.out.println("✅ CORE: Podaci uspešno sačuvani (Status, GlobalID, BankTimestamp).");
                return ResponseEntity.ok().build();
            }
        }

        System.out.println("❌ CORE: Transakcija [" + cleanId + "] nije pronađena.");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Transaction not found");
    }
}