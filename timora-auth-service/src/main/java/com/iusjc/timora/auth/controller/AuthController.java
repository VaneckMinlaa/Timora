package com.iusjc.timora.auth.controller;

import com.iusjc.timora.auth.dto.*;
import com.iusjc.timora.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur REST pour l'authentification
 */
@Tag(name = "Authentification", description = "Login, logout, refresh token, réinitialisation mot de passe")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Connexion", description = "Authentifie un utilisateur et retourne un JWT + refresh token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Connexion réussie", content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "401", description = "Identifiants incorrects"),
            @ApiResponse(responseCode = "403", description = "Compte désactivé ou bloqué")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("Tentative de connexion pour l'email: {}", request.getEmail());
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la connexion: {}", e.getMessage(), e);
            
            // Déterminer le statut HTTP selon le type d'erreur
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Erreur d'authentification";
            String errorMessageLower = errorMessage.toLowerCase();
            
            // Vérifier si c'est un compte désactivé/bloqué
            boolean isAccountDisabled = errorMessageLower.contains("désactivé") || 
                                       errorMessageLower.contains("inactif") ||
                                       errorMessageLower.contains("bloqué") ||
                                       errorMessageLower.contains("disabled") ||
                                       errorMessageLower.contains("inactive") ||
                                       errorMessageLower.contains("blocked") ||
                                       errorMessageLower.contains("réactiver") ||
                                       errorMessageLower.contains("support it");
            
            // Retourner un message d'erreur détaillé avec le bon statut HTTP
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", errorMessage);
            errorResponse.put("error", isAccountDisabled ? "Account disabled" : "Authentication failed");
            
            // Retourner 403 pour compte désactivé, 401 pour autres erreurs d'authentification
            HttpStatus status = isAccountDisabled ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
            return ResponseEntity.status(status).body(errorResponse);
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la connexion: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", "Erreur serveur. Veuillez réessayer.");
            errorResponse.put("error", "Internal server error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/auth/register
     * Enregistre un nouvel utilisateur
     * DÉSACTIVÉ: L'enregistrement public n'est pas autorisé.
     * Les utilisateurs doivent être créés par les administrateurs via la gestion des utilisateurs.
     */
    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        log.warn("Tentative d'inscription publique refusée pour l'email: {}", request.getEmail());
        // Retourner 403 Forbidden pour indiquer que l'enregistrement public n'est pas autorisé
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    /**
     * POST /api/auth/refresh
     * Rafraîchit un token
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Tentative de rafraîchissement de token");
        try {
            LoginResponse response = authService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erreur lors du rafraîchissement du token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * POST /api/auth/logout
     * Déconnecte un utilisateur
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        log.info("Tentative de déconnexion");
        // TODO: Extraire le userId du token JWT
        // Pour l'instant, on accepte juste la requête
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Demande de réinitialisation mot de passe", description = "Envoie un code de vérification par email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Code envoyé", content = @Content(schema = @Schema(implementation = ForgotPasswordResponse.class))),
            @ApiResponse(responseCode = "404", description = "Email non trouvé")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Demande de réinitialisation de mot de passe pour: {}", request.getEmail());
        try {
            authService.requestPasswordReset(request.getEmail());
            ForgotPasswordResponse response = ForgotPasswordResponse.builder()
                    .message("Un code de vérification a été envoyé à votre adresse email")
                    .build();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la demande de réinitialisation: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage());
            errorResponse.put("error", "Password reset failed");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la demande de réinitialisation: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", "Erreur serveur. Veuillez réessayer.");
            errorResponse.put("error", "Internal server error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @Operation(summary = "Vérifier le code et réinitialiser le mot de passe", description = "Vérifie le code reçu par email et réinitialise le mot de passe")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mot de passe réinitialisé", content = @Content(schema = @Schema(implementation = ResetPasswordResponse.class))),
            @ApiResponse(responseCode = "400", description = "Code invalide")
    })
    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        log.info("Vérification du code de réinitialisation pour: {}", request.getEmail());
        try {
            ResetPasswordResponse response = authService.verifyResetCode(request.getEmail(), request.getCode());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erreur lors de la vérification du code: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage());
            errorResponse.put("error", "Code verification failed");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}
