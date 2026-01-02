package com.psp.core.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class PaymentRequest {
    private Double amount;
    private String currency;
    private String merchantOrderId;
    private String merchantTimestamp;
    private String cardHolder;
    private String pan;
    private String expiryDate;
    private String cvv;
}