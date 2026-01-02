package com.psp.core.controller;

import com.psp.core.dto.PaymentRequest;
import com.psp.core.model.Transaction;
import com.psp.core.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {
        // 1. GENERISANJE PODATAKA PO SPECIFIKACIJI (STAN + TIMESTAMP)
        transaction.setStatus("INITIATED");
        transaction.setPspTimestamp(LocalDateTime.now()); // PSP Vreme
        transaction.setStan(generateStan()); // Generiše random 6 cifara (npr. 123456)
        
        // Čuvamo odmah da bismo imali ID i STAN u bazi pre slanja
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

                // 3. Šaljemo zahtev ka CARD servisu
                String response = restTemplate.postForObject(
                    "http://localhost:8082/cards/pay", 
                    request, 
                    String.class
                );

                // 4. Obrada odgovora
                if ("SUCCESS".equals(response)) {
                    savedTransaction.setStatus("SUCCESS");
                    // Pošto banka vraća samo String "SUCCESS", ovde ćemo simulirati
                    // da nam je banka poslala Global ID (da ispoštujemo bazu podataka)
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

    // --- Pomoćna funkcija za generisanje STAN-a (6 cifara) ---
    private String generateStan() {
        Random random = new Random();
        int number = random.nextInt(900000) + 100000; // Opseg 100000 - 999999
        return String.valueOf(number);
    }
}