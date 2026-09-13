package com.iusjc.timora.user.controller;

import com.iusjc.timora.user.dto.ResetPasswordRequest;
import com.iusjc.timora.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur pour la gestion des mots de passe
 * Endpoints appelés par Auth Service
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserPasswordController {

    private final UserService userService;

    /**
     * PATCH /api/users/:id/reset-password
     * Réinitialise le mot de passe d'un utilisateur (appelé par Auth Service)
     */
    @PatchMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable String id,
            @Valid @RequestBody ResetPasswordRequest request) {
        log.info("Réinitialisation du mot de passe pour l'utilisateur: {}", id);
        userService.resetPassword(id, request.getNewPassword());
        return ResponseEntity.noContent().build();
    }
}
