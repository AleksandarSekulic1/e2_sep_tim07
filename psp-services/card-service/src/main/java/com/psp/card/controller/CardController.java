package com.psp.card.controller;

import com.psp.card.dto.CardPaymentRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cards")
public class CardController {

    @PostMapping("/pay")
    public String processPayment(@RequestBody CardPaymentRequest request) {
        System.out.println("---------------------------------------------");
        System.out.println("CARD SERVICE - OBRADA PLAĆANJA:");
        System.out.println("Iznos: " + request.getAmount() + " " + request.getCurrency());
        System.out.println("Vlasnik: " + request.getCardHolder());
        
        // --- SIMULACIJA POSLOVNE LOGIKE ---
        
        // 1. Provera iznosa (Ako je veći od 20.000, odbijamo)
        if (request.getAmount() > 20000) {
            System.out.println("❌ STATUS: FAILED (Nedovoljno sredstava / Limit prekoračen)");
            System.out.println("---------------------------------------------");
            return "FAILED";
        }

        // 2. Provera validnosti kartice (npr. ne sme biti prazan broj)
        if (request.getPan() == null || request.getPan().length() < 13) {
            System.out.println("❌ STATUS: ERROR (Neispravan broj kartice)");
            System.out.println("---------------------------------------------");
            return "ERROR";
        }

        // Ako je sve u redu:
        System.out.println("✅ STATUS: SUCCESS (Transakcija odobrena)");
        System.out.println("---------------------------------------------");
        
        return "SUCCESS";
    }
}