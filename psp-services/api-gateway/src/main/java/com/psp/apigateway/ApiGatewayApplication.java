package com.psp.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}

	// OVDE DEFINISEMO RUTU PROGRAMSKI (Umesto u YAML-u)
	@Bean
	public RouteLocator myRoutes(RouteLocatorBuilder builder) {
		return builder.routes()
			// Ruta za Core Service
			.route("core-service", r -> r.path("/core/**")
				.filters(f -> f.stripPrefix(1))
				.uri("http://localhost:8081"))
			
			// NOVA RUTA: Card Service
			.route("card-service", r -> r.path("/card/**")
				.filters(f -> f.stripPrefix(1))
				.uri("http://localhost:8082"))
				
			.build();
	}
}