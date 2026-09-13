package com.iusjc.timora.notification.config;

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
 * Configuration OpenAPI (Swagger) pour la documentation du Notification Service.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8086}")
    private String serverPort;

    @Bean
    public OpenAPI notificationServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Timora - Notification Service API")
                        .description("API d'envoi de notifications : email (réinitialisation mot de passe, nouveau mot de passe, " +
                                "compte bloqué), codes de vérification.")
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact()
                                .name("Timora IUSJC")
                                .email("timora.iusjc@gmail.com"))
                        .license(new License().name("Propriétaire")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Notification Service (local)"),
                        new Server().url("http://localhost:8080").description("Via API Gateway")));
    }
}
