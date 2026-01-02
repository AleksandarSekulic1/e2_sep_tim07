package com.psp.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate; // <--- DODAJ OVAJ IMPORT

@SpringBootApplication
public class CoreServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CoreServiceApplication.class, args);
	}

    // DODAJ OVO: Alat za slanje HTTP zahteva
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}