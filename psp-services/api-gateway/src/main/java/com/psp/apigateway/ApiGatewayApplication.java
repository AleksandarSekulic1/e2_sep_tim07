package com.psp.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
// Importi potrebni za CORS
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    // 1. DEFINISANJE RUTA (Rutiranje ka mikroservisima)
    @Bean
    public RouteLocator myRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
            // Ruta za Core Service (8081)
            .route("core-service", r -> r.path("/core/**")
                .filters(f -> f.stripPrefix(1))
                .uri("http://localhost:8081"))
            
            // Ruta za Card Service (8082)
            .route("card-service", r -> r.path("/card/**")
                .filters(f -> f.stripPrefix(1))
                .uri("http://localhost:8082"))
                
            // Ruta za PayPal Service (8083)
            .route("paypal-service", r -> r.path("/paypal/**")
                .filters(f -> f.stripPrefix(1))
                .uri("http://localhost:8083"))

            // --- NOVO: Ruta za Bank Service (Simulator) ---
            // Svi zahtevi koji idu na /bank/... biće prosleđeni na port 8085
            .route("bank-service", r -> r.path("/bank/**")
                .filters(f -> f.stripPrefix(1))
                .uri("http://localhost:8085"))
                
            .build();
    }

    // 2. CORS KONFIGURACIJA (Dozvola za Angular)
    @Bean
    public CorsWebFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:4200"); // Angular PSP
        // Ako ćeš imati i poseban frontend za banku (npr. na portu 4202), dodaj i njega:
        config.addAllowedOrigin("http://localhost:4202"); 
        
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsWebFilter(source);
    }
}