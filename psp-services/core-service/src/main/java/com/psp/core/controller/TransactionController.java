package com.psp.core.controller;

import com.psp.core.dto.PaymentRequest;
import com.psp.core.model.Merchant;
import com.psp.core.model.Transaction;
import com.psp.core.repository.MerchantRepository; // <--- NOVO
import com.psp.core.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException; // <--- NOVO

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MerchantRepository merchantRepository; // <--- NOVO

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {
        
        // --- 0. BEZBEDNOSNA PROVERA (AUTHENTICATION) ---
        // Proveravamo da li prodavnica postoji i da li je lozinka tačna
        Optional<Merchant> merchantOpt = merchantRepository.findById(transaction.getMerchantId());
        
        if (merchantOpt.isEmpty()) {
            System.out.println("❌ GREŠKA: Nepoznat Merchant ID: " + transaction.getMerchantId());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nepoznat prodavac");
        }
        
        Merchant merchant = merchantOpt.get();
        if (!merchant.getMerchantPassword().equals(transaction.getMerchantPassword())) {
            System.out.println("❌ GREŠKA: Pogrešna lozinka za prodavca: " + transaction.getMerchantId());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Pogrešna lozinka (API Key)");
        }
        
        System.out.println("✅ AUTH USPEŠAN: Zahtev od " + merchant.getName());
        // ------------------------------------------------

        // 1. GENERISANJE PODATAKA
        transaction.setStatus("INITIATED");
        transaction.setPspTimestamp(LocalDateTime.now());
        transaction.setStan(generateStan());
        
        Transaction savedTransaction = transactionRepository.save(transaction);

        // 2. Proveri metodu plaćanja
        if ("CARD".equals(transaction.getPaymentMethod())) {
            try {
                PaymentRequest request = new PaymentRequest(
                    transaction.getAmount(),
                    transaction.getCurrency(),
                    transaction.getMerchantOrderId(),
                    transaction.getMerchantTimestamp() != null ? transaction.getMerchantTimestamp().toString() : null,
                    transaction.getCardHolder(),
                    transaction.getPan(),
                    transaction.getExpiryDate(),
                    transaction.getCvv()
                );

                String response = restTemplate.postForObject(
                    "http://localhost:8082/cards/pay", 
                    request, 
                    String.class
                );

                if ("SUCCESS".equals(response)) {
                    savedTransaction.setStatus("SUCCESS");
                    savedTransaction.setGlobalTransactionId(UUID.randomUUID().toString());
                } else {
                    savedTransaction.setStatus("FAILED");
                }

            } catch (Exception e) {
                System.out.println("Greška: " + e.getMessage());
                savedTransaction.setStatus("ERROR");
            }
            
            transactionRepository.save(savedTransaction);
        }

        return savedTransaction;
    }

    private String generateStan() {
        Random random = new Random();
        int number = random.nextInt(900000) + 100000;
        return String.valueOf(number);
    }
}