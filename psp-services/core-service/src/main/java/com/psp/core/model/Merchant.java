package com.psp.core.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}