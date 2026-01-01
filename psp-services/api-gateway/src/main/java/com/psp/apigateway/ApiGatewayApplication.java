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
			.route("core-service", r -> r.path("/core/**") // Ako putanja krece sa /core...
				.filters(f -> f.stripPrefix(1))            // ...obrisi "/core"...
				.uri("http://localhost:8081"))             // ...i posalji na port 8081.
			.build();
	}
}