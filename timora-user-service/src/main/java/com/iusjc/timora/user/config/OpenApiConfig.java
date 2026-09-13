package com.iusjc.timora.user.config;

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
 * Configuration OpenAPI (Swagger) pour la documentation du User Service.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8082}")
    private String serverPort;

    @Bean
    public OpenAPI userServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Timora - User Service API")
                        .description("API de gestion des utilisateurs : CRUD, profils, rôles (Administrateur, Enseignant, Étudiant), " +
                                "réinitialisation de mot de passe, activation/désactivation des comptes.")
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact()
                                .name("Timora IUSJC")
                                .email("timora.iusjc@gmail.com"))
                        .license(new License().name("Propriétaire")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("User Service (local)"),
                        new Server().url("http://localhost:8080").description("Via API Gateway")));
    }
}
