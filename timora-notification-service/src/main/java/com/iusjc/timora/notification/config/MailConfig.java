package com.iusjc.timora.notification.config;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Paths;

/**
 * Configuration pour le service email
 * Charge automatiquement les variables d'environnement depuis Config/.env
 */
@Configuration
@Slf4j
public class MailConfig {
    
    @PostConstruct
    public void loadEnvFile() {
        try {
            // Chemin vers le fichier .env dans le dossier Config
            String projectRoot = System.getProperty("user.dir");
            String envPath = Paths.get(projectRoot, "Config", ".env").toString();
            
            log.info(" Recherche du fichier .env dans: {}", envPath);
            
            // Essayer de charger depuis le dossier Config à la racine du projet
            Dotenv dotenv = null;
            try {
                dotenv = Dotenv.configure()
                    .directory("Config")
                    .filename(".env")
                    .ignoreIfMissing()
                    .load();
            } catch (Exception e) {
                // Si le chargement depuis "Config" échoue, essayer depuis la racine
                log.debug("Tentative de chargement depuis Config/ échouée, essai depuis la racine...");
                try {
                    dotenv = Dotenv.configure()
                        .directory("../Config")
                        .filename(".env")
                        .ignoreIfMissing()
                        .load();
                } catch (Exception e2) {
                    log.warn(" Impossible de charger le fichier .env depuis Config/. Utilisation des variables d'environnement système.");
                    return;
                }
            }
            
            if (dotenv == null) {
                log.warn(" Fichier .env introuvable. Utilisation des variables d'environnement système.");
                return;
            }
            
            int loadedCount = 0;
            // Charger les variables dans le système
            dotenv.entries().forEach(entry -> {
                String key = entry.getKey();
                String value = entry.getValue();
                
                // Ne pas écraser les variables déjà définies
                if (System.getenv(key) == null && System.getProperty(key) == null) {
                    System.setProperty(key, value);
                    // Masquer le mot de passe dans les logs
                    if (key.contains("PASSWORD")) {
                        log.debug(" Variable chargée: {} = ***masqué***", key);
                    } else {
                        log.debug(" Variable chargée: {} = {}", key, value);
                    }
                }
            });
            
            // Compter les variables chargées
            loadedCount = (int) dotenv.entries().stream()
                .filter(entry -> System.getProperty(entry.getKey()) != null)
                .count();
            
            if (loadedCount > 0) {
                log.info(" Configuration .env chargée avec succès ({} variables)", loadedCount);
            } else {
                log.info(" Fichier .env trouvé mais aucune nouvelle variable chargée (variables système prioritaires)");
            }
        } catch (Exception e) {
            log.warn(" Erreur lors du chargement du fichier .env: {}. Utilisation des variables d'environnement système.", e.getMessage());
            log.debug("Détails de l'erreur:", e);
        }
    }
}

