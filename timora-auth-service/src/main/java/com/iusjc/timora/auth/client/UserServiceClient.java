package com.iusjc.timora.auth.client;

import com.iusjc.timora.auth.dto.VerifyPasswordRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Client Feign pour la communication avec UserService
 * Permet à AuthService de communiquer avec UserService
 */
@FeignClient(
    name = "TIMORA-USER-SERVICE", 
    path = "/api/users",
    fallback = UserServiceClientFallback.class
)
public interface UserServiceClient {

    /**
     * Récupère un utilisateur par email
     * Utilise Map pour éviter les problèmes de sérialisation entre services
     */
    @GetMapping("/email/{email}")
    Map<String, Object> findByEmail(@PathVariable("email") String email);

    /**
     * Vérifie le mot de passe d'un utilisateur par email
     * Retourne les informations de l'utilisateur si le mot de passe est correct
     */
    @PostMapping("/email/{email}/verify-password")
    Map<String, Object> verifyPassword(
            @PathVariable("email") String email,
            @RequestBody VerifyPasswordRequest request);

    /**
     * Récupère un utilisateur par ID
     */
    @GetMapping("/{id}")
    Map<String, Object> getUserById(@PathVariable("id") String userId);

    /**
     * Met à jour la date de dernière connexion d'un utilisateur
     */
    @PutMapping("/{id}/last-login")
    void updateLastLogin(@PathVariable("id") String userId);

    /**
     * Réinitialise le mot de passe d'un utilisateur
     */
    @PutMapping("/{id}/reset-password")
    void resetPassword(@PathVariable("id") String userId, @RequestBody Map<String, String> request);
}