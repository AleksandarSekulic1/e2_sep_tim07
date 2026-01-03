package com.psp.core.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

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
    @JsonProperty("paymentMethod") // Eksplicitno mapiranje za Jackson
    private String paymentMethod;    // CARD, QR, PAYPAL, CRYPTO 
    private String status;           // INITIATED, SUCCESS, FAILED, ERROR
    
    private String stan; // System Trace Audit Number (6 cifara)
    private LocalDateTime pspTimestamp; // Vreme kad je PSP obradio zahtev
    private String globalTransactionId; // ID koji nam vraća banka
    private LocalDateTime acquirerTimestamp; // <--- DODAJ OVO

    //@Transient // Ovo znači: "Ne čuvaj u bazu, samo koristi u memoriji"
    private String cardHolder;
    
    //@Transient
    private String pan;
    
    //@Transient
    private String expiryDate;
    
    //@Transient
    private String cvv;

    @Transient // Ne čuva se u istoriji transakcija, služi samo za proveru!
    private String merchantPassword;

    // URL-ovi za redirekciju (čuvanje nije obavezno u bazi, ali korisno za logove)
    private String successUrl;
    private String failedUrl;
    private String errorUrl;

    // Dodaj ovo polje u klasu Transaction
private String reason;

// I odgovarajući getter/setter ako nemaš @Data ili @Setter
public String getReason() { return reason; }
public void setReason(String reason) { this.reason = reason; }
}