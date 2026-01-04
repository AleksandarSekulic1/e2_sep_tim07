package com.psp.core.service;

import com.psp.core.dto.PaymentRequest;
import com.psp.core.model.Merchant;
import com.psp.core.model.Transaction;
import com.psp.core.repository.MerchantRepository;
import com.psp.core.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    public Optional<Merchant> authenticateMerchant(String id, String password) {
        return merchantRepository.findById(id)
                .filter(m -> m.getMerchantPassword().equals(password));
    }

    public Transaction createInitialTransaction(PaymentRequest request) {
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
        transaction.setStan(String.valueOf(new Random().nextInt(900000) + 100000));

        return transactionRepository.save(transaction);
    }

    @Transactional
public boolean updateStatus(String identifier, Map<String, Object> statusUpdate) {
    String cleanId = identifier.trim();
    
    // 1. Pokušaj pretrage direktno po merchantOrderId
    Transaction transaction = transactionRepository.findByMerchantOrderId(cleanId);
    
    // 2. Ako nije nađen, koristi fleksibilnu pretragu (kao u tvom starom kontroleru)
    if (transaction == null) {
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
        
        // Logika za PAID / SUCCESS status
        if ("SUCCESS".equalsIgnoreCase(status) || "PAID".equalsIgnoreCase(status)) {
            transaction.setStatus("PAID");
            if (statusUpdate.containsKey("globalTransactionId")) {
                transaction.setGlobalTransactionId(statusUpdate.get("globalTransactionId").toString());
            }
        } 
        // Logika za FAILED status
        else if ("FAILED".equalsIgnoreCase(status)) {
            transaction.setStatus("FAILED");
            if (statusUpdate.containsKey("reason")) {
                transaction.setReason(statusUpdate.get("reason").toString());
            }
        }

        // Ažuriranje vremena ako postoji
        if (statusUpdate.containsKey("acquirerTimestamp")) {
            transaction.setAcquirerTimestamp(LocalDateTime.now());
        }

        transactionRepository.saveAndFlush(transaction);
        return true;
    }
    return false;
}

@Transactional
public boolean updatePaymentMethod(Long id, String method) {
    return transactionRepository.findById(id).map(transaction -> {
        transaction.setPaymentMethod(method);
        transactionRepository.save(transaction);
        System.out.println("✅ CORE SERVICE: Metoda " + method + " upisana za ID: " + id);
        return true;
    }).orElse(false);
}

}