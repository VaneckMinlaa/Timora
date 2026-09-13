package com.iusjc.timora.schedule.config;

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
 * Configuration OpenAPI (Swagger) pour la documentation du Schedule Service.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8085}")
    private String serverPort;

    @Bean
    public OpenAPI scheduleServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Timora - Schedule Service API")
                        .description("API de gestion des emplois du temps : écoles, filières, UEs, classes, cours, " +
                                "assignation enseignants et groupes.")
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact()
                                .name("Timora IUSJC")
                                .email("timora.iusjc@gmail.com"))
                        .license(new License().name("Propriétaire")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Schedule Service (local)"),
                        new Server().url("http://localhost:8080").description("Via API Gateway")));
    }
}
