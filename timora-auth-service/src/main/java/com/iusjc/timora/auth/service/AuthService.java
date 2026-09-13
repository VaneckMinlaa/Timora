package com.iusjc.timora.auth.service;

import com.iusjc.timora.auth.client.UserServiceClient;
import com.iusjc.timora.auth.dto.LoginRequest;
import com.iusjc.timora.auth.dto.LoginResponse;
import com.iusjc.timora.auth.dto.RegisterRequest;
import com.iusjc.timora.auth.dto.ResetPasswordResponse;
import com.iusjc.timora.auth.dto.VerifyPasswordRequest;
import com.iusjc.timora.auth.model.RefreshToken;
import com.iusjc.timora.auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Service pour l'authentification
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserServiceClient userServiceClient;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetService passwordResetService;
    
    /**
     * Authentifie un utilisateur
     */
    public LoginResponse login(LoginRequest request) {
        log.info("Tentative de connexion pour l'email: {}", request.getEmail());
        
        try {
            log.debug("📡 Vérification du mot de passe pour l'email: {}", request.getEmail());
            
            // Vérifier le mot de passe via UserService
            Map<String, Object> userMap;
            try {
                VerifyPasswordRequest verifyRequest = new VerifyPasswordRequest(request.getPassword());
                userMap = userServiceClient.verifyPassword(request.getEmail(), verifyRequest);
            } catch (Exception e) {
                log.error(" Erreur lors de la vérification du mot de passe: {}", e.getMessage());
                log.error("   Type: {}, Cause: {}", e.getClass().getName(), 
                    e.getCause() != null ? e.getCause().getMessage() : "Inconnue");
                
                // Vérifier si c'est une FeignException pour obtenir le statut HTTP
                int statusCode = -1;
                String responseBody = "";
                if (e instanceof feign.FeignException) {
                    feign.FeignException feignEx = (feign.FeignException) e;
                    statusCode = feignEx.status();
                    log.error("   Status HTTP: {}", statusCode);
                    try {
                        responseBody = feignEx.contentUTF8();
                        log.debug("   Response body: {}", responseBody);
                    } catch (Exception ex) {
                        // Ignorer si on ne peut pas lire le body
                    }
                }
                
                // Gérer les différents codes d'erreur HTTP
                String errorMsg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
                String responseBodyLower = responseBody != null ? responseBody.toLowerCase() : "";
                
                // Vérifier d'abord si c'est un compte bloqué (403 Forbidden)
                if (statusCode == 403 || 
                    errorMsg.contains("désactivé") || errorMsg.contains("bloqué") || 
                    errorMsg.contains("inactif") || errorMsg.contains("disabled") ||
                    errorMsg.contains("blocked") || errorMsg.contains("inactive") ||
                    responseBodyLower.contains("désactivé") || responseBodyLower.contains("bloqué") ||
                    responseBodyLower.contains("inactif") || responseBodyLower.contains("disabled") ||
                    responseBodyLower.contains("blocked") || responseBodyLower.contains("inactive")) {
                    // Forbidden - Compte bloqué/désactivé
                    // Extraire le message exact du body de la réponse si disponible
                    String forbiddenMessage = "Votre compte est désactivé. Veuillez contacter un administrateur pour réactiver votre compte.";
                    if (responseBody != null && !responseBody.isEmpty()) {
                        try {
                            // Essayer d'extraire le message depuis le JSON de réponse
                            if (responseBody.contains("\"message\"")) {
                                int messageStart = responseBody.indexOf("\"message\"") + 10;
                                int messageEnd = responseBody.indexOf("\"", messageStart);
                                if (messageEnd > messageStart) {
                                    forbiddenMessage = responseBody.substring(messageStart, messageEnd);
                                }
                            }
                        } catch (Exception ex) {
                            // Utiliser le message par défaut
                        }
                    }
                    throw new RuntimeException(forbiddenMessage);
                } else if (statusCode == 400 || statusCode == 404 || 
                    errorMsg.contains("400") || errorMsg.contains("404") || 
                    errorMsg.contains("bad request") || errorMsg.contains("not found") ||
                    errorMsg.contains("email ou mot de passe incorrect") ||
                    errorMsg.contains("utilisateur non trouvé")) {
                    // BadRequest ou NotFound - Mot de passe incorrect ou utilisateur non trouvé
                    throw new RuntimeException("Email ou mot de passe incorrect");
                } else if (statusCode == 500 || errorMsg.contains("500") || 
                          errorMsg.contains("internal server error")) {
                    // Internal Server Error
                    throw new RuntimeException("Erreur serveur. Veuillez réessayer plus tard.");
                } else {
                    // Autres erreurs (503, timeout, service indisponible, etc.)
                throw new RuntimeException("Service utilisateur indisponible. Vérifiez que le UserService est démarré et enregistré dans Eureka.");
                }
            }
            
            if (userMap == null || userMap.isEmpty()) {
                log.warn("Utilisateur non trouvé pour l'email: {}", request.getEmail());
                throw new RuntimeException("Email ou mot de passe incorrect");
            }
            
            log.debug("Utilisateur trouvé dans UserService: {}", userMap);
            log.debug("Clés disponibles dans userMap: {}", userMap.keySet());
            log.debug("Valeur de 'role' dans userMap: {} (type: {})", userMap.get("role"), 
                    userMap.get("role") != null ? userMap.get("role").getClass().getName() : "null");
            
            // Extraire les informations de l'utilisateur
            String userId = (String) userMap.get("id");
            String email = (String) userMap.get("email");
            String firstName = (String) userMap.get("firstName");
            String lastName = (String) userMap.get("lastName");
            Boolean isActive = (Boolean) userMap.get("isActive");
            Object roleObj = userMap.get("role");
            
            // Le rôle peut être un enum (ADMINISTRATEUR, ENSEIGNANT) ou une string
            // Gérer différents formats de sérialisation
            String role = null;
            if (roleObj != null) {
                if (roleObj instanceof String) {
                    role = (String) roleObj;
                } else if (roleObj instanceof Map) {
                    // Si c'est un Map (LinkedHashMap), essayer d'extraire la valeur
                    @SuppressWarnings("unchecked")
                    Map<String, Object> roleMap = (Map<String, Object>) roleObj;
                    // Les enums peuvent être sérialisés comme {"name": "ADMINISTRATEUR"} ou similaire
                    Object nameObj = roleMap.get("name");
                    if (nameObj != null) {
                        role = nameObj.toString();
                    } else {
                        // Essayer de trouver n'importe quelle valeur string dans le Map
                        for (Object value : roleMap.values()) {
                            if (value instanceof String) {
                                role = (String) value;
                                break;
                            }
                        }
                    }
                } else {
                    // Si c'est un enum ou un objet, utiliser toString()
                    // Les enums sont normalement sérialisés comme leur nom (ADMINISTRATEUR, ENSEIGNANT)
                    role = roleObj.toString();
                }
            }
            
            // Si le rôle est toujours null ou vide, essayer d'autres clés possibles
            if (role == null || role.isEmpty()) {
                log.warn(" Rôle non trouvé avec la clé 'role', recherche dans d'autres clés...");
                Object roleAlt = userMap.get("roleUtilisateur");
                if (roleAlt != null) {
                    role = roleAlt.toString();
                }
            }
            
            // Si toujours null, utiliser une valeur par défaut basée sur l'email ou autre
            if (role == null || role.isEmpty()) {
                log.error(" Rôle non trouvé pour l'utilisateur {}, utilisation de la valeur par défaut", email);
                role = "USER"; // Valeur par défaut seulement si vraiment introuvable
            }
            
            log.info(" Rôle final extrait: {}", role);
            String profilePhoto = (String) userMap.get("profilePicture");
            
            // Vérifier que les données essentielles sont présentes
            if (userId == null || email == null) {
                log.error(" Données utilisateur incomplètes: userId={}, email={}", userId, email);
                throw new RuntimeException("Données utilisateur incomplètes. Veuillez contacter un administrateur.");
            }
            
            // Vérifier si l'utilisateur est actif
            // Note: Cette vérification est déjà faite dans UserService.verifyPassword() qui lance une ForbiddenException
            // Cette vérification est redondante mais sert de sécurité supplémentaire
            if (isActive != null && !isActive) {
                log.warn(" Tentative de connexion avec un compte inactif: {}", email);
                throw new RuntimeException("Votre compte est désactivé. Veuillez contacter le Support IT pour réactiver votre compte.");
            }
            
            // Le mot de passe a déjà été vérifié par UserService.verifyPassword()
            log.info(" Utilisateur authentifié avec succès: {} (ID: {}, Rôle: {})", email, userId, role);
            
            // Générer les tokens
            String token = jwtService.generateToken(userId, email, firstName, lastName, role);
            String refreshToken = jwtService.generateRefreshToken(userId);
            
            log.debug(" Tokens générés avec succès");
            
            // Sauvegarder le refresh token
            try {
                saveRefreshToken(userId, refreshToken);
                log.debug(" Refresh token sauvegardé");
            } catch (Exception e) {
                log.error(" Erreur lors de la sauvegarde du refresh token: {}", e.getMessage());
                // Ne pas faire échouer la connexion pour cela
            }
            
            // Mettre à jour la dernière connexion
            try {
                userServiceClient.updateLastLogin(userId);
                log.debug(" Dernière connexion mise à jour");
            } catch (Exception e) {
                log.warn(" Impossible de mettre à jour la dernière connexion: {}", e.getMessage());
                // Ne pas faire échouer la connexion pour cela
            }
            
            return LoginResponse.builder()
                    .token(token)
                    .refreshToken(refreshToken)
                    .userId(userId)
                    .email(email)
                    .firstName(firstName != null ? firstName : "")
                    .lastName(lastName != null ? lastName : "")
                    .role(role)
                    .profilePhoto(profilePhoto != null ? profilePhoto : "")
                    .build();
                    
        } catch (RuntimeException e) {
            // Relancer les RuntimeException telles quelles
            log.error(" Erreur lors de la connexion pour l'email {}: {}", request.getEmail(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error(" Erreur inattendue lors de la connexion pour l'email {}: {}", request.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la connexion. Veuillez réessayer.");
        }
    }
    
    /**
     * Enregistre un nouvel utilisateur
     */
    public LoginResponse register(RegisterRequest request) {
        log.info("Tentative d'inscription pour l'email: {}", request.getEmail());
        
        // TODO: Créer l'utilisateur dans UserService via Feign
        // UserResponse user = userServiceClient.createUser(request);
        
        log.warn(" Register non implémenté - utilisation de données mockées");
        
        // Pour l'instant, on retourne une réponse mockée
        String userId = "mock-user-id";
        String token = jwtService.generateToken(
            userId, 
            request.getEmail(), 
            request.getFirstName(), 
            request.getLastName(), 
            "USER"
        );
        String refreshToken = jwtService.generateRefreshToken(userId);
        
        saveRefreshToken(userId, refreshToken);
        
        return LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(userId)
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role("USER")
                .build();
    }
    
    /**
     * Rafraîchit un token
     */
    @Transactional
    public LoginResponse refreshToken(String refreshTokenString) {
        log.info("Tentative de rafraîchissement de token");
        
        // Vérifier le refresh token
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElseThrow(() -> new RuntimeException("Refresh token invalide"));
        
        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token expiré");
        }
        
        // Vérifier le token JWT
        if (jwtService.isTokenExpired(refreshTokenString)) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token expiré");
        }
        
        String userId = jwtService.extractUserId(refreshTokenString);
        
        // TODO: Récupérer l'utilisateur depuis UserService
        // User user = userServiceClient.getUserById(userId);
        
        // Générer un nouveau token
        String newToken = jwtService.generateToken(
            userId,
            "mock@example.com", // À remplacer
            "Mock",
            "User",
            "USER"
        );
        
        // Optionnel: générer un nouveau refresh token (rotation)
        String newRefreshToken = jwtService.generateRefreshToken(userId);
        refreshToken.setToken(newRefreshToken);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(refreshToken);
        
        return LoginResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .userId(userId)
                .email("mock@example.com")
                .firstName("Mock")
                .lastName("User")
                .role("USER")
                .build();
    }
    
    /**
     * Déconnecte un utilisateur
     */
    @Transactional
    public void logout(String userId) {
        log.info("Déconnexion de l'utilisateur: {}", userId);
        refreshTokenRepository.deleteByUserId(userId);
    }

    /**
     * Sauvegarde un refresh token
     */
    @Transactional
    private void saveRefreshToken(String userId, String token) {
        // Supprimer les anciens tokens de l'utilisateur
        refreshTokenRepository.deleteByUserId(userId);
        
        // Calculer la date d'expiration (7 jours)
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(userId);
        refreshToken.setToken(token);
        refreshToken.setExpiresAt(expiresAt);
        
        refreshTokenRepository.save(refreshToken);
    }
    
    /**
     * Demande de réinitialisation de mot de passe
     */
    @Transactional
    public void requestPasswordReset(String email) {
        passwordResetService.requestPasswordReset(email);
    }
    
    /**
     * Vérifie le code et réinitialise le mot de passe
     */
    @Transactional
    public ResetPasswordResponse verifyResetCode(String email, String code) {
        String newPassword = passwordResetService.resetPassword(email, code);
        
        return ResetPasswordResponse.builder()
                .message("Votre mot de passe a été réinitialisé avec succès. Un email contenant votre nouveau mot de passe vous a été envoyé.")
                .email(email)
                .build();
    }
}
