package com.iusjc.timora.reservation.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuration OpenAPI (Swagger) pour la documentation du Reservation Service.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8084}")
    private String serverPort;

    @Bean
    public OpenAPI reservationServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Timora - Reservation Service API")
                        .description("API de gestion des réservations et disponibilités : création/modification/annulation " +
                                "de réservations, disponibilités par utilisateur, vérification de créneaux, suggestion de salles.")
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact()
                                .name("Timora IUSJC")
                                .email("timora.iusjc@gmail.com"))
                        .license(new License().name("Propriétaire")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Reservation Service (local)"),
                        new Server().url("http://localhost:8080").description("Via API Gateway")));
    }
}
