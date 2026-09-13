package com.iusjc.timora.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import io.github.cdimascio.dotenv.Dotenv;
import java.nio.file.Paths;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@EnableDiscoveryClient
@SpringBootApplication
public class NotificationServiceApplication {

    public static void main(String[] args) {
        try {
            Dotenv dotenv = null;
            try {
                dotenv = Dotenv.configure()
                    .directory("Config")
                    .filename(".env")
                    .ignoreIfMissing()
                    .load();
            } catch (Exception e) {
                try {
                    dotenv = Dotenv.configure()
                        .directory("../Config")
                        .filename(".env")
                        .ignoreIfMissing()
                        .load();
                } catch (Exception e2) {
                    // ignore
                }
            }
            
            if (dotenv != null) {
                dotenv.entries().forEach(entry -> {
                    if (System.getProperty(entry.getKey()) == null) {
                        System.setProperty(entry.getKey(), entry.getValue());
                    }
                });
                System.out.println(" .env variables loaded successfully.");
            }
        } catch (Exception e) {
            System.err.println(" Could not load .env file.");
        }
        
        SpringApplication.run(NotificationServiceApplication.class, args);
    }

}
