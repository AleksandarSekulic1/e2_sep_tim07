package com.psp.core.controller;

import com.psp.core.model.Transaction;
import com.psp.core.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/transactions") // Osnovna putanja: /transactions
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    // 1. GET metoda: Vraća sve transakcije iz baze
    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    // 2. POST metoda: Kreira novu transakciju
    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {
        // Postavljamo vreme i status pre čuvanja
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setStatus("CREATED");
        
        // Čuvanje u bazu (Hibernate radi INSERT)
        return transactionRepository.save(transaction);
    }
}