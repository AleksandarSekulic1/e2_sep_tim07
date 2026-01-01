package com.psp.core.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions") // Ime tabele u Postgres-u
@Data // Lombok generiše gettere, settere, toString...
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount;       // Iznos (npr. 100.50)
    
    private String currency;     // Valuta (npr. EUR, RSD)
    
    private String merchantId;   // ID prodavca kojem ide novac
    
    private String status;       // CREATED, COMPLETED, FAILED
    
    private LocalDateTime timestamp; // Vreme transakcije
}