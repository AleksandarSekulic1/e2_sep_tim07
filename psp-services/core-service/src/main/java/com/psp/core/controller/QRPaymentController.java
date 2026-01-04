package com.psp.core.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.psp.core.model.Transaction;
import com.psp.core.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.UUID;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/qr")
// Dozvoljava Angularu komunikaciju
//@CrossOrigin(origins = "http://localhost:4200") 
public class QRPaymentController {

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping("/generate/{pspTransactionId}")
    public ResponseEntity<?> generateQRCode(@PathVariable Long pspTransactionId) {
        return transactionRepository.findById(pspTransactionId).map(transaction -> {
            try {
                // --- NOVO: NBS IPS Standardni format (Stavka 1.2) ---
                // K:PR (Kôd: Plaćanje računom) | V:01 (Verzija) | C:1 (Karakter skup: UTF-8)
                // R: Račun primaoca (18 cifara)
                // N: Naziv primaoca
                // I: Valuta i Iznos (Format: RSD iznos sa zarezom)
                // SF: Šifra plaćanja (Obično 289 za e-commerce)
                // S: Svrha plaćanja
                
                String amountFormatted = String.format("%.2f", transaction.getAmount()).replace(".", ",");
                
                String ipsString = String.format(
                    "K:PR|V:01|C:1|R:%s|N:%s|I:RSD%s|SF:%s|S:%s|RO:%s",
                    "265000000012345678",      // R: Račun prodavca (fiktivni Acquirer račun)
                    "Rent-A-Car Agency DOO",   // N: Naziv prodavca
                    amountFormatted,           // I: Iznos (RSD1234,56)
                    "289",                     // SF: Šifra plaćanja (Trgovina preko interneta)
                    "Placanje po transakciji", // S: Svrha
                    transaction.getId()        // RO: Poziv na broj (Vaš ID transakcije)
                );

                QRCodeWriter qrCodeWriter = new QRCodeWriter();
                // NBS preporučuje određeni nivo korekcije grešaka, ali standardni je OK
                BitMatrix bitMatrix = qrCodeWriter.encode(ipsString, BarcodeFormat.QR_CODE, 300, 300);

                ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
                MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
                String base64Image = Base64.getEncoder().encodeToString(pngOutputStream.toByteArray());

                // Postavljamo metodu plaćanja (Stavka 1.1)
                transaction.setPaymentMethod("QR");
                transactionRepository.save(transaction);

                Map<String, String> response = new HashMap<>();
                response.put("qrCode", base64Image);
                response.put("ipsString", ipsString); // Korisno za debagovanje
                
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                     .body("Greška pri generisanju QR koda: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/simulate-pay/{pspTransactionId}")
    public ResponseEntity<?> simulatePayment(@PathVariable Long pspTransactionId) {
        return transactionRepository.findById(pspTransactionId).map(transaction -> {
            if (transaction.getAmount() > 20000) {
            System.out.println("❌ QR: Iznos " + transaction.getAmount() + " premašuje limit od 20.000 RSD");
            
            // Opciono: Možeš odmah postaviti status na FAILED u bazi
            transaction.setStatus("FAILED");
            transactionRepository.save(transaction);
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body("Iznos premašuje limit za QR plaćanje (maksimalno 20.000 RSD)");
        }
            transaction.setStatus("PAID");
            
            // Generišemo Global ID i Timestamp (Stavka 5 i 6 specifikacije)
            String mockGlobalId = "QR-IPS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            transaction.setGlobalTransactionId(mockGlobalId);
            transaction.setAcquirerTimestamp(java.time.LocalDateTime.now());
            
            transactionRepository.save(transaction);
            
            System.out.println("📱 QR IPS PLAĆANJE: Uspeh za ID " + pspTransactionId);
            return ResponseEntity.ok("Upešno simulirano plaćanje. Global ID: " + mockGlobalId);
        }).orElse(ResponseEntity.notFound().build());
    }
}