package com.iusjc.timora.user.config;

import com.iusjc.timora.user.entity.Administrateur;
import com.iusjc.timora.user.entity.User;
import com.iusjc.timora.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Initialiseur pour créer l'admin par défaut au démarrage de l'application
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // S'exécute en premier
public class DefaultAdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_ADMIN_EMAIL = "vaneck.minlaa@gmail.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123"; // Mot de passe par défaut
    private static final String DEFAULT_ADMIN_FIRST_NAME = "Timora";
    private static final String DEFAULT_ADMIN_LAST_NAME = "IUSJC";

    @Override
    public void run(String... args) throws Exception {
        log.info(" Vérification de l'existence de l'admin par défaut...");
        
        // Vérifier si l'admin existe déjà
        if (userRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
            log.info(" L'admin par défaut existe déjà avec l'email: {}", DEFAULT_ADMIN_EMAIL);
            
            // Vérifier si le mot de passe est hashé, sinon le migrer
            User existingAdmin = userRepository.findByEmail(DEFAULT_ADMIN_EMAIL)
                    .orElse(null);
            
            if (existingAdmin != null) {
                String storedPassword = existingAdmin.getMotDePasse();
                // Si le mot de passe n'est pas hashé, le hasher
                if (storedPassword != null && 
                    !storedPassword.startsWith("$2a$") && 
                    !storedPassword.startsWith("$2b$") && 
                    !storedPassword.startsWith("$2y$")) {
                    log.warn(" Mot de passe de l'admin en clair détecté. Migration vers BCrypt...");
                    String hashedPassword = passwordEncoder.encode(storedPassword);
                    existingAdmin.setMotDePasse(hashedPassword);
                    existingAdmin.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(existingAdmin);
                    log.info(" Mot de passe de l'admin migré vers BCrypt");
                }
            }
            return;
        }

        log.info(" Création de l'admin par défaut...");
        
        // Hasher le mot de passe avec BCrypt
        String hashedPassword = passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD);
        
        // Créer l'admin
        Administrateur admin = Administrateur.builder()
                .email(DEFAULT_ADMIN_EMAIL)
                .prenom(DEFAULT_ADMIN_FIRST_NAME)
                .nom(DEFAULT_ADMIN_LAST_NAME)
                .role(User.RoleUtilisateur.ADMINISTRATEUR)
                .motDePasse(hashedPassword)
                .isActive(true)
                .department("DSI")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedAdmin = userRepository.save(admin);
        
        log.info(" Admin par défaut créé avec succès!");
        log.info("   - Email: {}", DEFAULT_ADMIN_EMAIL);
        log.info("   - Mot de passe: {} (hashé avec BCrypt)", DEFAULT_ADMIN_PASSWORD);
        log.info("   - ID: {}", savedAdmin.getIdUtilisateur());
        log.warn(" IMPORTANT: Changez le mot de passe par défaut après la première connexion!");
    }
}

