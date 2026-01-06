package com.psp.core.config;

import com.psp.core.repository.MerchantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Data initializer for core service
 * Test merchant initialization removed - use merchant registration endpoint instead
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private MerchantRepository merchantRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--------------------------------------------");
        System.out.println("✅ PSP Core Service Started");
        System.out.println("📝 Register merchants at: POST /merchants/register");
        System.out.println("--------------------------------------------");
    }
}