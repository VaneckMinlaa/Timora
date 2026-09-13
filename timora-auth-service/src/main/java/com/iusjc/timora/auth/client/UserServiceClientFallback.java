package com.iusjc.timora.auth.client;

import com.iusjc.timora.auth.dto.VerifyPasswordRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Fallback pour UserServiceClient en cas d'erreur de communication
 */
@Component
@Slf4j
public class UserServiceClientFallback implements UserServiceClient {

    @Override
    public Map<String, Object> findByEmail(String email) {
        log.error("Erreur lors de l'appel à UserService.findByEmail pour l'email: {}", email);
        log.error("   Le UserService n'est probablement pas démarré ou n'est pas accessible via Eureka");
        throw new RuntimeException("Service utilisateur indisponible. Vérifiez que le UserService est démarré.");
    }

    @Override
    public Map<String, Object> verifyPassword(String email, VerifyPasswordRequest request) {
        log.error(" Erreur lors de l'appel à UserService.verifyPassword pour l'email: {}", email);
        log.error("   Le UserService n'est probablement pas démarré ou n'est pas accessible via Eureka");
        throw new RuntimeException("Service utilisateur indisponible. Vérifiez que le UserService est démarré.");
    }

    @Override
    public Map<String, Object> getUserById(String userId) {
        log.error(" Erreur lors de l'appel à UserService.getUserById pour l'ID: {}", userId);
        throw new RuntimeException("Service utilisateur indisponible.");
    }

    @Override
    public void updateLastLogin(String userId) {
        log.warn(" Impossible de mettre à jour la dernière connexion pour l'ID: {}", userId);
        // Ne pas lever d'exception car ce n'est pas critique
    }

    @Override
    public void resetPassword(String userId, Map<String, String> request) {
        log.error("Erreur lors de l'appel à UserService.resetPassword pour l'ID: {}", userId);
        log.error("   Le UserService n'est probablement pas démarré ou n'est pas accessible via Eureka");
        throw new RuntimeException("Service utilisateur indisponible. Impossible de réinitialiser le mot de passe.");
    }
}
