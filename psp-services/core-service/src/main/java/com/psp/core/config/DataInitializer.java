package com.psp.core.config;

import com.psp.core.model.Merchant;
import com.psp.core.repository.MerchantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private MerchantRepository merchantRepository;

    @Override
    public void run(String... args) throws Exception {
        // Proveravamo da li naš test prodavac već postoji
        String merchantId = "12345";
        
        if (merchantRepository.findById(merchantId).isEmpty()) {
            System.out.println("--------------------------------------------");
            System.out.println("⚠️ KREIRAM TEST PRODAVCA (MERCHANT) U BAZI ⚠️");
            
            Merchant merchant = new Merchant();
            merchant.setMerchantId(merchantId);
            merchant.setMerchantPassword("password"); // Mora se poklapati sa Frontend-om!
            merchant.setName("Agencija za Iznajmljivanje (Web Shop)");
            
            merchantRepository.save(merchant);
            
            System.out.println("✅ Prodavac kreiran: ID=12345, PASS=password");
            System.out.println("--------------------------------------------");
        } else {
            System.out.println("ℹ️ Test prodavac (12345) već postoji.");
        }
    }
}