package com.psp.core.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    // Podaci iz Tabele 1 specifikacije (Web Shop -> PSP)
    private String merchantId;          // ID prodavca
    private String merchantPassword;    // Lozinka/API Key
    private Double amount;              // Iznos
    private String currency;            // Valuta (npr. RSD)
    private String merchantOrderId;     // ID narudžbine sa Web Shopa
    private String merchantTimestamp;   // Vreme
    
    // URL-ovi za redirekciju (obavezni po specifikaciji)
    private String successUrl;
    private String failedUrl;
    private String errorUrl;
}