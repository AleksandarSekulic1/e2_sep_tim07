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

    // KORAK 1: Inicijalizacija (Web Shop šalje podatke)
    @PostMapping("/initiate") 
    public ResponseEntity<?> initiateTransaction(@RequestBody PaymentRequest request) {

        // --- 0. BEZBEDNOSNA PROVERA ---
        Optional<Merchant> merchantOpt = merchantRepository.findById(request.getMerchantId());

        if (merchantOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nepoznat prodavac");
        }

        Merchant merchant = merchantOpt.get();
        if (!merchant.getMerchantPassword().equals(request.getMerchantPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Pogrešna lozinka");
        }
        
        System.out.println("✅ AUTH USPEŠAN: Zahtev od " + merchant.getName());

        // --- 1. KREIRANJE TRANSAKCIJE ---
        Transaction transaction = new Transaction();
        transaction.setMerchantId(request.getMerchantId());
        // transaction.setMerchantPassword(request.getMerchantPassword()); // Nije bezbedno čuvati pass u bazi transakcija
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setMerchantOrderId(request.getMerchantOrderId());
        
        // Konverzija String timestamp-a u LocalDateTime (pazi na format koji šalje WebShop)
        // Ako puca, koristi LocalDateTime.now() privremeno
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

        // --- 2. VRAĆAMO ODGOVOR WEB SHOP-U ---
        // Vraćamo URL ka PSP Frontendu gde korisnik bira metodu.
        // Web Shop radi redirect na: http://localhost:4200/payment-methods/{pspTransactionId}
        
        Map<String, Object> response = new HashMap<>();
        response.put("pspTransactionId", savedTransaction.getId());
        response.put("paymentUrl", "http://localhost:4200/payment-methods/" + savedTransaction.getId());
        
        return ResponseEntity.ok(response);
    }
    
    // Endpoint da Frontend može da dohvati podatke o ceni
    @GetMapping("/{id}")
    public ResponseEntity<?> getTransactionDetails(@PathVariable Long id) {
        return ResponseEntity.ok(transactionRepository.findById(id));
    }

    private String generateStan() {
        Random random = new Random();
        int number = random.nextInt(900000) + 100000;
        return String.valueOf(number);
    }
}