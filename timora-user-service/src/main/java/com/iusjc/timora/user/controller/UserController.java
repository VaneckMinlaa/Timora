package com.iusjc.timora.user.controller;

import com.iusjc.timora.user.dto.*;
import com.iusjc.timora.user.entity.User;
import com.iusjc.timora.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la gestion des utilisateurs
 */
@Tag(name = "Utilisateurs", description = "CRUD et opérations sur les utilisateurs")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @Operation(summary = "Liste des utilisateurs", description = "Récupère tous les utilisateurs avec filtres optionnels : role, active, search")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des utilisateurs"),
            @ApiResponse(responseCode = "400", description = "Paramètre invalide")
    })
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {

        User.RoleUtilisateur userRole = null;
        if (role != null && !role.trim().isEmpty()) {
            try {
                userRole = User.RoleUtilisateur.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Si le rôle est invalide, on ignore le filtre
                log.warn("Rôle invalide ignoré: {}", role);
            }
        }

        List<UserResponse> users = userService.getAllUsers(userRole, active, search);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Détail d'un utilisateur", description = "Récupère un utilisateur par son identifiant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Utilisateur trouvé"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouvé")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@Parameter(description = "ID de l'utilisateur") @PathVariable String id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Créer un utilisateur", description = "Crée un nouvel utilisateur (Administrateur, Enseignant ou Étudiant)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Utilisateur créé"),
            @ApiResponse(responseCode = "400", description = "Données invalides (email déjà utilisé, etc.)")
    })
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @Operation(summary = "Modifier un utilisateur", description = "Met à jour les informations d'un utilisateur existant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Utilisateur mis à jour"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouvé")
    })
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = userService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Supprimer un utilisateur", description = "Supprime définitivement un utilisateur")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Utilisateur supprimé"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouvé")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@Parameter(description = "ID de l'utilisateur") @PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/users/:id/password
     * Change le mot de passe d'un utilisateur
     */
    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(
            @PathVariable String id,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/users/:id/profile
     * Récupère le profil d'un utilisateur
     */
    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable String id) {
        UserProfileResponse profile = userService.getUserProfile(id);
        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/users/:id/profile
     * Met à jour le profil d'un utilisateur
     */
    @PutMapping("/{id}/profile")
    public ResponseEntity<UserProfileResponse> updateUserProfile(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserProfileResponse profile = userService.updateUserProfile(id, request);
        return ResponseEntity.ok(profile);
    }

    /**
     * GET /api/users/search?query=...
     * Recherche des utilisateurs
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String query) {
        List<UserResponse> users = userService.searchUsers(query);
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/users/role/:role
     * Récupère les utilisateurs par rôle
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable String role) {
        List<UserResponse> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/users/statistics
     * Récupère les statistiques des utilisateurs
     */
    @GetMapping("/statistics")
    public ResponseEntity<UserStatisticsResponse> getUserStatistics() {
        UserStatisticsResponse statistics = userService.getUserStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * PATCH /api/users/:id/activate
     * Active un utilisateur
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activateUser(@PathVariable String id) {
        UserResponse user = userService.activateUser(id);
        return ResponseEntity.ok(user);
    }

    /**
     * PATCH /api/users/:id/deactivate
     * Désactive un utilisateur
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(@PathVariable String id) {
        UserResponse user = userService.deactivateUser(id);
        return ResponseEntity.ok(user);
    }

    /**
     * GET /api/users/email/:email
     * Récupère un utilisateur par email (utilisé par AuthService)
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        UserResponse user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    /**
     * POST /api/users/email/:email/verify-password
     * Vérifie le mot de passe d'un utilisateur (utilisé par AuthService)
     */
    @PostMapping("/email/{email}/verify-password")
    public ResponseEntity<UserResponse> verifyPassword(
            @PathVariable String email,
            @Valid @RequestBody VerifyPasswordRequest request) {
        UserResponse user = userService.verifyPassword(email, request.getPassword());
        return ResponseEntity.ok(user);
    }

    /**

     * Met à jour la date de dernière connexion (appelé par AuthService)
     */
    @PutMapping("/{id}/last-login")
    public ResponseEntity<Void> updateLastLogin(@PathVariable String id) {
        userService.updateLastLogin(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/users/:id/reset-password
     * Réinitialise le mot de passe d'un utilisateur (appelé par AuthService)
     */
    @PutMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword");
        userService.resetPassword(id, newPassword);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/users/password-reset/request
     * Demande de réinitialisation de mot de passe
     */
    @PostMapping("/password-reset/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(
            @Valid @RequestBody RequestPasswordResetRequest request) {
        userService.requestPasswordReset(request.getEmail());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Un code de vérification a été envoyé à votre adresse email");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/users/password-reset/verify
     * Vérifie le code et réinitialise le mot de passe
     */
    @PostMapping("/password-reset/verify")
    public ResponseEntity<ResetPasswordResponse> verifyResetCode(
            @Valid @RequestBody VerifyResetCodeRequest request) {
        ResetPasswordResponse response = userService.verifyResetCodeAndResetPassword(
            request.getEmail(),
            request.getCode()
        );
        return ResponseEntity.ok(response);
    }
}

