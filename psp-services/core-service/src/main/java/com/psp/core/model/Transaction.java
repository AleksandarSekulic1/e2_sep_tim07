package com.psp.core.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Podaci iz Tabele 1 specifikacije 
    private String merchantId;       // ID prodavca
    private Double amount;           // Iznos
    private String currency;         // Valuta (npr. EUR, RSD)
    private String merchantOrderId;  // ID narudžbine sa Web Shopa
    private LocalDateTime merchantTimestamp; // Vreme kreiranja na Web Shopu
    
    // Naša interna polja
    private String paymentMethod;    // CARD, QR, PAYPAL, CRYPTO [cite: 13]
    private String status;           // INITIATED, SUCCESS, FAILED, ERROR
    
    // URL-ovi za redirekciju (čuvanje nije obavezno u bazi, ali korisno za logove)
    private String successUrl;
    private String failedUrl;
    private String errorUrl;
}