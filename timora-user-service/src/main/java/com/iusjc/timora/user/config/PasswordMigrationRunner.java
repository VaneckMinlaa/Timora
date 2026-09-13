package com.iusjc.timora.user.config;

import com.iusjc.timora.user.entity.User;
import com.iusjc.timora.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Migre tous les mots de passe en clair vers BCrypt au démarrage
 * S'exécute après DefaultAdminInitializer
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2) // S'exécute après DefaultAdminInitializer (Order 1 par défaut)
public class PasswordMigrationRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info(" Vérification des mots de passe à migrer...");
        
        // Récupérer tous les utilisateurs
        List<User> allUsers = userRepository.findAll();
        
        int migratedCount = 0;
        int alreadyHashedCount = 0;
        
        for (User user : allUsers) {
            String storedPassword = user.getMotDePasse();
            
            if (storedPassword == null || storedPassword.isEmpty()) {
                log.warn(" Utilisateur {} ({}) a un mot de passe vide", 
                        user.getEmail(), user.getIdUtilisateur());
                continue;
            }
            
            // Vérifier si le mot de passe est déjà hashé
            boolean isHashed = storedPassword.startsWith("$2a$") || 
                              storedPassword.startsWith("$2b$") || 
                              storedPassword.startsWith("$2y$");
            
            if (isHashed) {
                alreadyHashedCount++;
                continue;
            }
            
            // Le mot de passe est en clair, le hasher
            log.info(" Migration du mot de passe pour l'utilisateur: {} ({})", 
                    user.getEmail(), user.getIdUtilisateur());
            
            String hashedPassword = passwordEncoder.encode(storedPassword);
            user.setMotDePasse(hashedPassword);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            migratedCount++;
        }
        
        log.info(" Migration des mots de passe terminée:");
        log.info("   - Mots de passe migrés: {}", migratedCount);
        log.info("   - Mots de passe déjà hashés: {}", alreadyHashedCount);
        log.info("   - Total utilisateurs: {}", allUsers.size());
        
        if (migratedCount > 0) {
            log.info(" Tous les mots de passe sont maintenant hashés avec BCrypt!");
        } else {
            log.info(" Aucun mot de passe à migrer. Tous les mots de passe sont déjà hashés.");
        }
    }
}

