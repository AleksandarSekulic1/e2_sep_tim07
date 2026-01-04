package com.psp.paypal.service;

import com.psp.paypal.dto.PayPalPaymentRequest;
import com.psp.paypal.model.PayPalTransaction;
import com.psp.paypal.repository.PayPalTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PayPalService {

    @Autowired
    private PayPalTransactionRepository repository;

    @Autowired
    private RestTemplate restTemplate;

    private final String CORE_SERVICE_UPDATE_METHOD_URL = "http://core-service:8080/transactions/update-method/";
    private final String CORE_SERVICE_UPDATE_STATUS_URL = "http://core-service:8080/transactions/update-status/";

    // 1. Kreiranje PayPal plaćanja
    public Map<String, String> createPayment(PayPalPaymentRequest request) {
        // Update metode u Core servisu
        updateCoreTransactionMethod(request.getPspTransactionId());

        // Generisanje PayPal Payment ID (simulacija)
        String paypalPaymentId = "PAYPAL-" + UUID.randomUUID().toString();
        Instant expiryTime = Instant.now().plus(15, ChronoUnit.MINUTES);

        // Kreiranje approval URL-a (simulacija PayPal login stranice)
        String approvalUrl = "http://localhost:4200/paypal-payment/" + paypalPaymentId +
                             "?amount=" + request.getAmount() +
                             "&merchantOrderId=" + request.getMerchantOrderId() +
                             "&expiresAt=" + expiryTime.toString();

        // Čuvanje transakcije u MongoDB
        PayPalTransaction transaction = new PayPalTransaction();
        transaction.setPspTransactionId(request.getPspTransactionId());
        transaction.setMerchantOrderId(request.getMerchantOrderId());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setPaypalPaymentId(paypalPaymentId);
        transaction.setStatus("CREATED");
        transaction.setApprovalUrl(approvalUrl);
        transaction.setCreatedAt(LocalDateTime.now());
        repository.save(transaction);

        Map<String, String> response = new HashMap<>();
        response.put("paymentId", paypalPaymentId);
        response.put("approvalUrl", approvalUrl);
        response.put("expiresAt", expiryTime.toString());
        return response;
    }

    // 2. Izvršavanje plaćanja nakon PayPal autorizacije
    public Map<String, String> executePayment(String paymentId, String payerId, String merchantOrderId) {
        PayPalTransaction transaction = repository.findByPaypalPaymentId(paymentId)
                .orElseThrow(() -> new RuntimeException("PAYMENT_NOT_FOUND"));

        if (!"CREATED".equals(transaction.getStatus())) {
            throw new RuntimeException("PAYMENT_ALREADY_PROCESSED");
        }

        // Simulacija PayPal validacije (u realnom sistemu ovde bi se pozivao PayPal API)
        boolean isPayerValid = validatePayer(payerId);

        if (isPayerValid) {
            // Uspešna transakcija
            transaction.setPaypalPayerId(payerId);
            transaction.setStatus("COMPLETED");
            transaction.setCompletedAt(LocalDateTime.now());
            repository.save(transaction);

            // Notifikacija Core servisa
            notifyCoreService(merchantOrderId, "SUCCESS", paymentId, null);

            Map<String, String> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("paymentId", paymentId);
            return response;
        } else {
            // Neuspešna transakcija
            transaction.setStatus("FAILED");
            transaction.setErrorMessage("INVALID_PAYER");
            repository.save(transaction);

            notifyCoreService(merchantOrderId, "FAILED", null, "INVALID_PAYER");

            throw new RuntimeException("INVALID_PAYER");
        }
    }

    // 3. Otkazivanje plaćanja
    public void cancelPayment(String paymentId, String merchantOrderId) {
        PayPalTransaction transaction = repository.findByPaypalPaymentId(paymentId).orElse(null);
        
        if (transaction != null) {
            transaction.setStatus("CANCELLED");
            repository.save(transaction);
        }

        notifyCoreService(merchantOrderId, "FAILED", null, "USER_CANCELLED");
    }

    // Pomoćne metode
    private void updateCoreTransactionMethod(Long pspTransactionId) {
        try {
            Map<String, String> updateRequest = new HashMap<>();
            updateRequest.put("method", "PAYPAL");
            restTemplate.put(CORE_SERVICE_UPDATE_METHOD_URL + pspTransactionId, updateRequest);
            System.out.println("✅ CORE: Metoda PAYPAL upisana za ID: " + pspTransactionId);
        } catch (Exception e) {
            System.err.println("⚠️ CORE ERROR: Neuspešan upis metode: " + e.getMessage());
        }
    }

    private void notifyCoreService(String merchantOrderId, String status, String paymentId, String reason) {
        try {
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("status", status);
            statusUpdate.put("reason", reason != null ? reason : "PAYPAL_" + status);
            statusUpdate.put("globalTransactionId", paymentId);
            statusUpdate.put("acquirerTimestamp", LocalDateTime.now().toString());

            restTemplate.put(CORE_SERVICE_UPDATE_STATUS_URL + merchantOrderId, statusUpdate);
            System.out.println("📞 WEBHOOK [" + status + "] -> Razlog: " + reason);
        } catch (Exception e) {
            System.err.println("⚠️ Greška pri slanju statusa Core servisu: " + e.getMessage());
        }
    }

    private boolean validatePayer(String payerId) {
        // Simulacija validacije - u realnom sistemu bi se pozvao PayPal API
        // Za testiranje: prihvata sve PayPal ID-ove osim "INVALID"
        return payerId != null && !payerId.equals("INVALID");
    }
}
