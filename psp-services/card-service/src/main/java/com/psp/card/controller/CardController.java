package com.psp.card.controller;

import com.psp.card.dto.CardPaymentRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cards")
public class CardController {

    @PostMapping("/pay")
    public String processPayment(@RequestBody CardPaymentRequest request) {
        // OVDE ĆE KASNIJE BITI LOGIKA ZA BANKU (Validacija PAN-a, Datuma...)
        System.out.println("Card Service primio zahtev: " + request);
        
        // Za sada samo simuliramo uspeh
        return "SUCCESS";
    }
}