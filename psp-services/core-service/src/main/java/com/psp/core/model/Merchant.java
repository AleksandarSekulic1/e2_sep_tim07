package com.psp.core.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "merchants")
public class Merchant {

    @Id
    private String merchantId;       // Npr. "prodavnica-auto-rent"
    
    private String merchantPassword; // Npr. "sifra123" (API Key)
    
    private String name;             // Npr. "Auto Rent D.O.O."

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> paymentMethods; // ["BANK", "PAYPAL", "CRYPTO"]

    // Merchant-specific callback URLs (Table 1 defaults)
    private String successUrl;
    private String failedUrl;
    private String errorUrl;
}