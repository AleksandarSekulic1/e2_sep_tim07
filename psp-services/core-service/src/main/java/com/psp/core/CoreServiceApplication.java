package com.psp.core; // Proveri paket

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean; // <--- OBAVEZNO
import org.springframework.web.client.RestTemplate; // <--- OBAVEZNO

@SpringBootApplication
public class CoreServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoreServiceApplication.class, args);
    }

    // --- DODAJ OVO ---
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}