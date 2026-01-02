package com.psp.card.controller;

import com.psp.card.dto.CardPaymentRequest;
import org.springframework.web.bind.annotation.*;
import java.util.Random;

@RestController
@RequestMapping("/cards")
public class CardController {

    @PostMapping("/pay")
    public String processPayment(@RequestBody CardPaymentRequest request) {
        System.out.println("---------------------------------------------");
        System.out.println("CARD SERVICE - OBRADA PLAĆANJA:");
        System.out.println("Vlasnik: " + request.getCardHolder());
        System.out.println("PAN: " + request.getPan());

        // 1. Validacija: Da li su podaci uopšte tu?
        if (request.getPan() == null || request.getPan().trim().isEmpty()) {
            System.out.println("❌ GREŠKA: Broj kartice je prazan.");
            return "ERROR";
        }

        // 2. Validacija: Lunov Algoritam (OBAVEZNO PO SPECIFIKACIJI)
        // Uklanjamo razmake pre provere (za svaki slučaj)
        String cleanPan = request.getPan().replaceAll("\\s+", "");
        if (!luhnCheck(cleanPan)) {
            System.out.println("❌ GREŠKA: Neispravan broj kartice (Pao na Lunovom testu).");
            System.out.println("---------------------------------------------");
            return "ERROR";
        }

        // 3. Poslovna Logika: Provera stanja na računu
        if (request.getAmount() > 20000) {
            System.out.println("❌ ODBIJENO: Nedovoljno sredstava (Iznos > 20.000).");
            System.out.println("---------------------------------------------");
            return "FAILED";
        }

        // Ako je sve prošlo:
        System.out.println("✅ ODOBRENO: Transakcija uspešna.");
        System.out.println("---------------------------------------------");
        return "SUCCESS";
    }

    // --- POMOĆNA FUNKCIJA: LUNOV ALGORITAM ---
    private boolean luhnCheck(String cardNo) {
        int nDigits = cardNo.length();
        int nSum = 0;
        boolean isSecond = false;
        
        // Idemo od desna na levo
        for (int i = nDigits - 1; i >= 0; i--) {
            int d = cardNo.charAt(i) - '0';

            if (isSecond == true)
                d = d * 2;

            // Ako je dvocifren (npr 18), saberi cifre (1+8=9)
            nSum += d / 10;
            nSum += d % 10;

            isSecond = !isSecond;
        }
        return (nSum % 10 == 0);
    }
}