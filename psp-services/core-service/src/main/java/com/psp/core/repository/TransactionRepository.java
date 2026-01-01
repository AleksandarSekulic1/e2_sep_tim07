package com.psp.core.repository;

import com.psp.core.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Ovde možemo dodati metode tipa: findByMerchantId(String id), ali za sad nam ne treba ništa.
    // JpaRepository već ima save(), findAll(), findById()...
}