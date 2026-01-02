package com.psp.card.dto;

import lombok.Data;

@Data
public class CardPaymentRequest {
    private Double amount;
    private String currency;
    private String merchantOrderId;
    private String merchantTimestamp;
    private String cardHolder;
    private String pan;
    private String expiryDate;
    private String cvv;
}