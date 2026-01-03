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

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/qr")
// Ova anotacija je KLJUČNA. Dozvoljava Angularu da "vidi" ovaj kontroler.
//@CrossOrigin(origins = "http://localhost:4200") // <--- DODAJ OVU LINIJU
public class QRPaymentController {

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping("/generate/{pspTransactionId}")
public ResponseEntity<?> generateQRCode(@PathVariable Long pspTransactionId) {
    return transactionRepository.findById(pspTransactionId).map(transaction -> {
        try {
            // NBS IPS Format (Standard Skeniraj i plati)
            String ipsString = String.format(
                "K:PR|V:01|C:1|R:%s|N:%s|I:RSD%.2f|P:Placanje usluge %s",
                "265000000012345678", 
                "Rent-A-Car Agency",   
                transaction.getAmount(),
                transaction.getMerchantOrderId()
            ).replace(".", ",");

            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(ipsString, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            String base64Image = Base64.getEncoder().encodeToString(pngOutputStream.toByteArray());

            // Postavljamo metodu plaćanja u bazi na QR
            transaction.setPaymentMethod("QR");
            transactionRepository.save(transaction);

            Map<String, String> response = new HashMap<>();
            response.put("qrCode", base64Image); // Ovaj ključ Angular traži
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Greška na serveru: " + e.getMessage());
        }
    }).orElse(ResponseEntity.notFound().build());
}

@PostMapping("/simulate-pay/{pspTransactionId}")
public ResponseEntity<?> simulatePayment(@PathVariable Long pspTransactionId) {
    return transactionRepository.findById(pspTransactionId).map(transaction -> {
        transaction.setStatus("PAID");
        transactionRepository.save(transaction);
        System.out.println("📱 QR SIMULACIJA: Transakcija " + pspTransactionId + " je PLAĆENA.");
        return ResponseEntity.ok("Upešno simulirano plaćanje");
    }).orElse(ResponseEntity.notFound().build());
}
}