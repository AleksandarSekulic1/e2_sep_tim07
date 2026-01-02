package com.psp.core.controller;

import com.psp.core.dto.PaymentRequest;
import com.psp.core.model.Transaction;
import com.psp.core.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RestTemplate restTemplate; // Naš telefon za zvanje drugih servisa

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {
        // 1. Postavi početni status
        transaction.setStatus("INITIATED");
        Transaction savedTransaction = transactionRepository.save(transaction);

        // 2. Proveri metodu plaćanja
        if ("CARD".equals(transaction.getPaymentMethod())) {
            try {
                // Pakujemo podatke za slanje (ISPRAVLJENO: Sada je čisto i bez dupliranja)
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

                // 3. Šaljemo zahtev ka CARD servisu (Port 8082)
                String response = restTemplate.postForObject(
                    "http://localhost:8082/cards/pay", 
                    request, 
                    String.class
                );

                // 4. Ažuriramo status na osnovu odgovora
                if ("SUCCESS".equals(response)) {
                    savedTransaction.setStatus("SUCCESS");
                } else {
                    savedTransaction.setStatus("FAILED");
                }

            } catch (Exception e) {
                // Ako pukne veza sa Card servisom
                System.out.println("Greška pri komunikaciji sa Card servisom: " + e.getMessage());
                savedTransaction.setStatus("ERROR");
            }
            
            // Čuvamo novi status u bazu
            transactionRepository.save(savedTransaction);
        }

        return savedTransaction;
    }
}