package com.psp.core.config;

import com.psp.core.model.Merchant;
import com.psp.core.repository.MerchantRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final MerchantRepository merchantRepository;

    public DataInitializer(MerchantRepository merchantRepository) {
        this.merchantRepository = merchantRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Ako prodavnica ne postoji, kreiraj je
        if (!merchantRepository.existsById("prodavnica-auto-rent")) {
            Merchant m = new Merchant(
                "prodavnica-auto-rent", 
                "tajna_sifra_123", 
                "Agencija za Iznajmljivanje"
            );
            merchantRepository.save(m);
            System.out.println("✅ KREIRAN TEST MERCHANT: prodavnica-auto-rent / tajna_sifra_123");
        }
    }
}