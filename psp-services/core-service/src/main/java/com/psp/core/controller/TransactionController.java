package com.psp.core.controller;

import com.psp.core.model.Transaction;
import com.psp.core.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    // GET: Vraća sve transakcije
    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    // POST: Kreira novu transakciju (podaci stižu sa Web Shopa)
    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {
        // Više ne postavljamo ručno timestamp ovde jer nam "merchantTimestamp"
        // stiže direktno sa Web Shopa (Angulara).
        
        // Postavljamo početni status
        transaction.setStatus("INITIATED"); 
        
        // Čuvamo u bazu
        return transactionRepository.save(transaction);
    }
}