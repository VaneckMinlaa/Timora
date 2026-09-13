package com.iusjc.timora.auth.config;

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
 * Configuration OpenAPI (Swagger) pour la documentation du Auth Service.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8081}")
    private String serverPort;

    @Bean
    public OpenAPI authServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Timora - Auth Service API")
                        .description("API d'authentification et d'autorisation : login, logout, refresh token, " +
                                "vérification de session, gestion JWT.")
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact()
                                .name("Timora IUSJC")
                                .email("timora.iusjc@gmail.com"))
                        .license(new License().name("Propriétaire")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Auth Service (local)"),
                        new Server().url("http://localhost:8080").description("Via API Gateway")));
    }
}
