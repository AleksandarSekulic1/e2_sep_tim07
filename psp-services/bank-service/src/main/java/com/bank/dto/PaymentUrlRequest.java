package com.bank.dto;

import lombok.Data;

@Data
public class PaymentUrlRequest {
    private String merchantId;      // ID prodavca
    private Double amount;
    private String currency;
    private String merchantOrderId; // ID transakcije
    private String merchantTimestamp;
}