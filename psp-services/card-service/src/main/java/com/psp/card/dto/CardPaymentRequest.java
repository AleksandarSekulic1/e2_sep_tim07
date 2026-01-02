package com.psp.card.dto;

import lombok.Data;

@Data
public class CardPaymentRequest {
    private Double amount;
    private String currency;
    private String merchantOrderId;
    private String merchantTimestamp;
}