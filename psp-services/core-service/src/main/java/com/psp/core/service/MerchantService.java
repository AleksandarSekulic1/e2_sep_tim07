package com.psp.core.service;

import com.psp.core.dto.MerchantMethodsResponse;
import com.psp.core.dto.MerchantUpdateRequest;
import com.psp.core.model.Merchant;
import com.psp.core.repository.MerchantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MerchantService {

    @Autowired
    private MerchantRepository merchantRepository;

    public Merchant registerMerchant(Merchant merchant) {
        if (merchant.getMerchantId() == null || merchant.getMerchantId().isEmpty()) {
            merchant.setMerchantId(UUID.randomUUID().toString());
        }
        if (merchant.getMerchantPassword() == null || merchant.getMerchantPassword().isEmpty()) {
            merchant.setMerchantPassword(UUID.randomUUID().toString().replace("-", ""));
        }

        List<String> methods = ensureAtLeastOne(merchant.getPaymentMethods());
        merchant.setPaymentMethods(methods);
        hydrateUrlsIfMissing(merchant);

        return merchantRepository.save(merchant);
    }

    public Merchant updateMerchantSubscription(String merchantId, MerchantUpdateRequest request) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new RuntimeException("Merchant not found"));

        merchant.setPaymentMethods(ensureAtLeastOne(request.getPaymentMethods()));
        merchant.setSuccessUrl(request.getSuccessUrl());
        merchant.setFailedUrl(request.getFailedUrl());
        merchant.setErrorUrl(request.getErrorUrl());

        return merchantRepository.save(merchant);
    }

    public Merchant getMerchant(String merchantId) {
        return merchantRepository.findById(merchantId)
                .orElseThrow(() -> new RuntimeException("Merchant not found"));
    }

    public MerchantMethodsResponse getMerchantMethods(String merchantId) {
        Merchant merchant = getMerchant(merchantId);
        return new MerchantMethodsResponse(
                merchant.getMerchantId(),
                merchant.getPaymentMethods(),
                merchant.getSuccessUrl(),
                merchant.getFailedUrl(),
                merchant.getErrorUrl()
        );
    }

    private List<String> ensureAtLeastOne(List<String> paymentMethods) {
        if (paymentMethods == null || paymentMethods.isEmpty()) {
            throw new RuntimeException("At least one payment method must be enabled");
        }
        return paymentMethods;
    }

    private void hydrateUrlsIfMissing(Merchant merchant) {
        if (merchant.getSuccessUrl() == null || merchant.getSuccessUrl().isBlank()) {
            merchant.setSuccessUrl("http://localhost:4200/success");
        }
        if (merchant.getFailedUrl() == null || merchant.getFailedUrl().isBlank()) {
            merchant.setFailedUrl("http://localhost:4200/failed");
        }
        if (merchant.getErrorUrl() == null || merchant.getErrorUrl().isBlank()) {
            merchant.setErrorUrl("http://localhost:4200/error");
        }
    }
}
