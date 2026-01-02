package com.psp.card.controller;

import com.psp.card.dto.CardPaymentRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cards")
public class CardController {

    @PostMapping("/pay")
    public String processPayment(@RequestBody CardPaymentRequest request) {
        // Ispis u konzolu (da vidimo da li radi)
        System.out.println(">>> STIGAO ZAHTEV ZA PLAĆANJE <<<");
        System.out.println("Iznos: " + request.getAmount() + " " + request.getCurrency());
        System.out.println("PAN: " + request.getPan());
        System.out.println("Vlasnik: " + request.getCardHolder());
        System.out.println("CVV: " + request.getCvv());
        
        return "SUCCESS";
    }
}