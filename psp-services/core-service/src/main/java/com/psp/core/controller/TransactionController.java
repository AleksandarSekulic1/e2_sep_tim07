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
//@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    // KORAK 1: Inicijalizacija (Web Shop šalje podatke)
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
        
        // BITNO: Ovde postavljamo ID koji nam je stigao sa Web Shop-a
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

    // --- POPRAVLJEN WEBHOOK ---
    @PutMapping("/update-status/{merchantOrderId}")
    @Transactional
    public ResponseEntity<?> updateTransactionStatus(
            @PathVariable String merchantOrderId, 
            @RequestBody Map<String, String> statusUpdate) {
        
        String cleanId = merchantOrderId.trim();
        System.out.println("🔔 CORE: Primio zahtev za ažuriranje ID: [" + cleanId + "]");

        // 1. Pokušaj pretrage po koloni merchant_order_id
        Transaction transaction = transactionRepository.findByMerchantOrderId(cleanId);
        
        // 2. Ako ne nađe (kao što se dešavalo), pretraži sve i uporedi sa STAN brojem ili ID-jem
        if (transaction == null) {
            System.out.println("🔎 CORE: merchantOrderId nije upalio, pretražujem celu bazu...");
            List<Transaction> all = transactionRepository.findAll();
            transaction = all.stream()
                .filter(t -> (t.getMerchantOrderId() != null && t.getMerchantOrderId().equals(cleanId)) || 
                             (t.getStan() != null && t.getStan().equals(cleanId)) ||
                             (t.getId() != null && String.valueOf(t.getId()).equals(cleanId)))
                .findFirst()
                .orElse(null);
        }

        if (transaction != null) {
            String status = statusUpdate.get("status");
            if ("SUCCESS".equalsIgnoreCase(status) || "PAID".equalsIgnoreCase(status)) {
                transaction.setStatus("PAID");
                transactionRepository.saveAndFlush(transaction);
                System.out.println("✅ CORE: Status USPEŠNO promenjen u PAID za transakciju: " + transaction.getId());
                return ResponseEntity.ok().build();
            }
        }

        System.out.println("❌ CORE: Transakcija [" + cleanId + "] nije pronađena ni nakon duboke pretrage.");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Transaction not found");
    }
}