package com.iusjc.timora.user.service;

import com.iusjc.timora.user.dto.*;
import com.iusjc.timora.user.entity.Administrateur;
import com.iusjc.timora.user.entity.Enseignant;
import com.iusjc.timora.user.entity.User;
import com.iusjc.timora.user.entity.PasswordResetToken;
import com.iusjc.timora.user.exception.BadRequestException;
import com.iusjc.timora.user.exception.ResourceNotFoundException;
import com.iusjc.timora.user.repository.UserRepository;
import com.iusjc.timora.user.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des utilisateurs
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordGeneratorService passwordGeneratorService;
    private final NotificationClient notificationClient;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    /**
     * Récupère tous les utilisateurs avec filtres optionnels
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(User.RoleUtilisateur role, Boolean isActive, String search) {
        List<User> users;

        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.searchUsers(search.trim());
        } else if (role != null && isActive != null) {
            users = userRepository.findByRoleAndIsActive(role, isActive);
        } else if (role != null) {
            users = userRepository.findByRole(role);
        } else if (isActive != null) {
            users = userRepository.findByIsActive(isActive);
        } else {
            users = userRepository.findAll();
        }

        return users.stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère un utilisateur par ID
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
        return UserResponse.fromEntity(user);
    }

    /**
     * Récupère un utilisateur par email
     */
    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email: " + email));
        return UserResponse.fromEntity(user);
    }

    /**
     * Vérifie le mot de passe d'un utilisateur par email
     * Retourne les informations de l'utilisateur si le mot de passe est correct
     * @throws ForbiddenException si le compte est bloqué/désactivé
     * @throws BadRequestException si le mot de passe est incorrect
     */
    @Transactional(readOnly = true)
    public UserResponse verifyPassword(String email, String password) {
        log.info(" Vérification du mot de passe pour l'email: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn(" Utilisateur non trouvé pour l'email: {}", email);
                    return new ResourceNotFoundException("Utilisateur", "email: " + email);
                });
        
        log.debug(" Utilisateur trouvé: {} (ID: {}, Rôle: {}, Actif: {})", 
                email, user.getIdUtilisateur(), user.getRole(), user.getIsActive());
        
        // Vérifier d'abord si le compte est actif
        if (user.getIsActive() == null || !user.getIsActive()) {
            log.warn(" Tentative de connexion avec un compte désactivé pour l'email: {}", email);
            throw new com.iusjc.timora.user.exception.ForbiddenException(
                    "Votre compte est désactivé. Veuillez contacter le Support IT pour réactiver votre compte.");
        }
        
        // Vérifier le mot de passe avec BCrypt
        // Supporte à la fois les mots de passe hashés (BCrypt) et en clair (pour migration)
        String storedPassword = user.getMotDePasse();
        boolean passwordMatches = false;
        boolean isHashed = storedPassword != null && (storedPassword.startsWith("$2a$") || 
                                                       storedPassword.startsWith("$2b$") || 
                                                       storedPassword.startsWith("$2y$"));
        
        log.debug("🔍 Format du mot de passe stocké: {}", isHashed ? "BCrypt (hashé)" : "En clair");
        
        // Si le mot de passe stocké commence par $2a$, $2b$ ou $2y$, c'est un hash BCrypt
        if (isHashed) {
            // Vérifier avec BCrypt
            passwordMatches = passwordEncoder.matches(password, storedPassword);
            log.debug(" Vérification BCrypt: {}", passwordMatches ? " Correspond" : " Ne correspond pas");
        } else {
            // Pour les anciens mots de passe en clair (migration)
            passwordMatches = storedPassword != null && storedPassword.equals(password);
            log.debug(" Vérification en clair: {}", passwordMatches ? " Correspond" : " Ne correspond pas");
            if (passwordMatches) {
                log.warn(" Mot de passe en clair détecté pour l'utilisateur {}. Migration vers BCrypt recommandée.", email);
            }
        }
        
        if (!passwordMatches) {
            log.warn(" Tentative de connexion avec un mot de passe incorrect pour l'email: {}", email);
            log.warn("   Format attendu: {}", isHashed ? "BCrypt" : "En clair");
            throw new BadRequestException("Email ou mot de passe incorrect");
        }
        
        log.info(" Mot de passe vérifié avec succès pour l'email: {}", email);
        return UserResponse.fromEntity(user);
    }

    /**
     * Récupère le profil d'un utilisateur par ID
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String id) {
        try {
            log.debug("Récupération du profil utilisateur pour l'ID: {}", id);
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
            
            if (user == null) {
                log.error("Utilisateur non trouvé pour l'ID: {}", id);
                throw new ResourceNotFoundException("Utilisateur", id);
            }
            
            log.debug("Utilisateur trouvé: {} {}", user.getPrenom(), user.getNom());
            UserProfileResponse response = UserProfileResponse.fromEntity(user);
            log.debug("Profil utilisateur converti avec succès");
            return response;
        } catch (ResourceNotFoundException e) {
            log.error("Utilisateur non trouvé pour l'ID: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de la récupération du profil utilisateur pour l'ID: {}", id, e);
            throw new RuntimeException("Erreur lors de la récupération du profil utilisateur: " + e.getMessage(), e);
        }
    }

    /**
     * Crée un nouvel utilisateur
     */
    public UserResponse createUser(CreateUserRequest request) {
        try {
            log.info("Tentative de création d'utilisateur avec email: {}", request.getEmail());
            
            // Vérifier si l'email existe déjà
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Un utilisateur avec cet email existe déjà");
            }

            String nom = request.getLastName();
            String prenom = request.getFirstName();

            // Vérifier si un utilisateur avec le même nom ET prénom existe déjà
            if (userRepository.existsByNomAndPrenom(nom, prenom)) {
                throw new BadRequestException("Un utilisateur avec le même nom et prénom existe déjà");
            }

            // Vérifier si le numéro de téléphone existe déjà (si fourni)
            Integer telephone = null;
            if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
                try {
                    // Nettoyer le numéro de téléphone (retirer espaces, tirets, etc.)
                    String cleanedPhone = request.getPhone().trim().replaceAll("[^0-9]", "");
                    if (cleanedPhone.isEmpty()) {
                        throw new BadRequestException("Le numéro de téléphone doit contenir au moins un chiffre");
                    }
                    telephone = Integer.parseInt(cleanedPhone);
                    if (userRepository.existsByTelephone(telephone)) {
                        throw new BadRequestException("Un utilisateur avec ce numéro de téléphone existe déjà");
                    }
                } catch (NumberFormatException e) {
                    throw new BadRequestException("Le numéro de téléphone doit être un nombre valide");
                }
            }

            // Convertir la liste d'écoles en chaîne séparée par virgules
            String schoolsString = request.getSchools() != null && !request.getSchools().isEmpty()
                    ? String.join(",", request.getSchools())
                    : null;

            // Générer un mot de passe aléatoire sécurisé
            String generatedPassword = passwordGeneratorService.generatePassword();
            // Hasher le mot de passe avec BCrypt avant de le stocker
            String hashedPassword = passwordEncoder.encode(generatedPassword);
            log.debug("Mot de passe généré et hashé pour l'utilisateur: {}", request.getEmail());

            // Déterminer le rôle par défaut
            User.RoleUtilisateur role = request.getRole() != null ? request.getRole() : User.RoleUtilisateur.ENSEIGNANT;
            log.debug("Création d'utilisateur avec le rôle: {}", role);

            // Créer l'utilisateur avec la bonne sous-classe selon le rôle
            // Cela permet à Hibernate de définir correctement la colonne user_type
            User user;
            if (role == User.RoleUtilisateur.ADMINISTRATEUR) {
                log.debug("Création d'un Administrateur");
                user = Administrateur.builder()
                        .email(request.getEmail())
                        .nom(nom)
                        .prenom(prenom)
                        .telephone(telephone)  // Utiliser la variable déjà parsée et validée
                        .role(role)
                        .department(request.getDepartment())
                        .organization(schoolsString)
                        .profilePicture(request.getProfilePicture())
                        .motDePasse(hashedPassword)  // Mot de passe hashé avec BCrypt
                        .isActive(true)
                        .build();
            } else if (role == User.RoleUtilisateur.ENSEIGNANT) {
                log.debug("Création d'un Enseignant");
                user = Enseignant.builder()
                        .email(request.getEmail())
                        .nom(nom)
                        .prenom(prenom)
                        .telephone(telephone)  // Utiliser la variable déjà parsée et validée
                        .role(role)
                        .department(request.getDepartment())
                        .organization(schoolsString)
                        .profilePicture(request.getProfilePicture())
                        .motDePasse(hashedPassword)  // Mot de passe hashé avec BCrypt
                        .isActive(true)
                        .build();
            } else {
                log.warn("Tentative de création d'un utilisateur avec un rôle non géré ou invalide: {}", role);
                throw new BadRequestException("Rôle invalide pour un acteur du système");
            }

            log.debug("Sauvegarde de l'utilisateur en base de données...");
            User savedUser = userRepository.save(user);
            log.info("Utilisateur créé avec succès - ID: {}, Email: {}, Rôle: {}", 
                    savedUser.getIdUtilisateur(), savedUser.getEmail(), savedUser.getRole());
            
            // Envoyer le mot de passe par email de manière asynchrone
            try {
                notificationClient.sendPasswordEmail(
                    savedUser.getEmail(), 
                    savedUser.getPrenom(), 
                    savedUser.getNom(), 
                    generatedPassword
                );
                log.info("Email avec mot de passe envoyé à: {}", savedUser.getEmail());
            } catch (Exception e) {
                log.error("Erreur lors de l'envoi de l'email à {}: {}", savedUser.getEmail(), e.getMessage());
                // Ne pas faire échouer la création si l'email échoue
                // L'administrateur pourra réinitialiser le mot de passe si nécessaire
            }
            
            return UserResponse.fromEntity(savedUser);
        } catch (BadRequestException e) {
            log.warn("Erreur de validation lors de la création d'utilisateur: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la création d'utilisateur avec email: {}", 
                    request.getEmail(), e);
            throw new RuntimeException("Erreur lors de la création de l'utilisateur: " + e.getMessage(), e);
        }
    }

    /**
     * Met à jour un utilisateur
     */
    public UserResponse updateUser(String id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));

        // Vérifier si le nom et prénom changent et s'ils sont uniques
        if (request.getFirstName() != null || request.getLastName() != null) {
            String newNom = request.getLastName() != null ? request.getLastName() : user.getNom();
            String newPrenom = request.getFirstName() != null ? request.getFirstName() : user.getPrenom();
            
            // Vérifier si un autre utilisateur a le même nom et prénom
            if (!newNom.equals(user.getNom()) || !newPrenom.equals(user.getPrenom())) {
                if (userRepository.existsByNomAndPrenom(newNom, newPrenom)) {
                    // Vérifier que ce n'est pas le même utilisateur
                    userRepository.findByNomAndPrenom(newNom, newPrenom).ifPresent(existingUser -> {
                        if (!existingUser.getIdUtilisateur().equals(user.getIdUtilisateur())) {
                            throw new BadRequestException("Un utilisateur avec le même nom et prénom existe déjà");
                        }
                    });
                }
            }
        }

        if (request.getFirstName() != null) {
            user.setPrenom(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setNom(request.getLastName());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            try {
                Integer telephone = Integer.parseInt(request.getPhone());
                // Vérifier si le téléphone existe déjà pour un autre utilisateur
                userRepository.findByTelephone(telephone).ifPresent(existingUser -> {
                    if (!existingUser.getIdUtilisateur().equals(user.getIdUtilisateur())) {
                        throw new BadRequestException("Un utilisateur avec ce numéro de téléphone existe déjà");
                    }
                });
                user.setTelephone(telephone);
            } catch (NumberFormatException e) {
                throw new BadRequestException("Le numéro de téléphone doit être un nombre valide");
            }
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getProfilePicture() != null) {
            // Vérifier la taille de la chaîne base64 (10 Mo ≈ 13-15 Mo en base64)
            String profilePicture = request.getProfilePicture();
            int maxSize = 15 * 1024 * 1024; // 15 Mo pour accommoder l'encodage base64
            if (profilePicture.length() > maxSize) {
                throw new BadRequestException("La photo de profil est trop grande. La taille maximale autorisée est de 10 Mo.");
            }
            user.setProfilePicture(profilePicture);
        }
        if (request.getSchools() != null) {
            String schoolsString = request.getSchools().isEmpty()
                    ? null
                    : String.join(",", request.getSchools());
            user.setOrganization(schoolsString);
        }

        User updatedUser = userRepository.save(user);
        log.info("Utilisateur mis à jour avec l'ID: {}", updatedUser.getIdUtilisateur());
        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Met à jour le profil d'un utilisateur
     */
    public UserProfileResponse updateUserProfile(String id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));

        // Vérifier si le nom et prénom changent et s'ils sont uniques
        if (request.getFirstName() != null || request.getLastName() != null) {
            String newNom = request.getLastName() != null ? request.getLastName() : user.getNom();
            String newPrenom = request.getFirstName() != null ? request.getFirstName() : user.getPrenom();
            
            // Vérifier si un autre utilisateur a le même nom et prénom
            if (!newNom.equals(user.getNom()) || !newPrenom.equals(user.getPrenom())) {
                if (userRepository.existsByNomAndPrenom(newNom, newPrenom)) {
                    // Vérifier que ce n'est pas le même utilisateur
                    userRepository.findByNomAndPrenom(newNom, newPrenom).ifPresent(existingUser -> {
                        if (!existingUser.getIdUtilisateur().equals(user.getIdUtilisateur())) {
                            throw new BadRequestException("Un utilisateur avec le même nom et prénom existe déjà");
                        }
                    });
                }
            }
        }

        if (request.getFirstName() != null) {
            user.setPrenom(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setNom(request.getLastName());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            try {
                Integer telephone = Integer.parseInt(request.getPhone());
                // Vérifier si le téléphone existe déjà pour un autre utilisateur
                userRepository.findByTelephone(telephone).ifPresent(existingUser -> {
                    if (!existingUser.getIdUtilisateur().equals(user.getIdUtilisateur())) {
                        throw new BadRequestException("Un utilisateur avec ce numéro de téléphone existe déjà");
                    }
                });
                user.setTelephone(telephone);
            } catch (NumberFormatException e) {
                throw new BadRequestException("Le numéro de téléphone doit être un nombre valide");
            }
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getProfilePicture() != null) {
            // Vérifier la taille de la chaîne base64 (10 Mo ≈ 13-15 Mo en base64)
            String profilePicture = request.getProfilePicture();
            int maxSize = 15 * 1024 * 1024; // 15 Mo pour accommoder l'encodage base64
            if (profilePicture.length() > maxSize) {
                throw new BadRequestException("La photo de profil est trop grande. La taille maximale autorisée est de 10 Mo.");
            }
            user.setProfilePicture(profilePicture);
        }
        if (request.getSchools() != null) {
            String schoolsString = request.getSchools().isEmpty()
                    ? null
                    : String.join(",", request.getSchools());
            user.setOrganization(schoolsString);
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        log.info("Profil utilisateur mis à jour avec l'ID: {}", updatedUser.getIdUtilisateur());
        return UserProfileResponse.fromEntity(updatedUser);
    }

    /**
     * Change le mot de passe d'un utilisateur
     */
    public void changePassword(String id, ChangePasswordRequest request) {
        log.info("Changement de mot de passe demandé pour l'utilisateur ID: {}", id);
        
        // Récupérer l'utilisateur
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));

        // Vérifier que les nouveaux mots de passe correspondent
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Les mots de passe ne correspondent pas");
        }

        // Vérifier l'ancien mot de passe
        String storedPassword = user.getMotDePasse();
        boolean oldPasswordMatches = false;
        
        // Si le mot de passe stocké commence par $2a$, $2b$ ou $2y$, c'est un hash BCrypt
        if (storedPassword != null && (storedPassword.startsWith("$2a$") || 
                                       storedPassword.startsWith("$2b$") || 
                                       storedPassword.startsWith("$2y$"))) {
            // Vérifier avec BCrypt
            oldPasswordMatches = passwordEncoder.matches(request.getOldPassword(), storedPassword);
        } else {
            // Pour les anciens mots de passe en clair (migration)
            oldPasswordMatches = storedPassword != null && storedPassword.equals(request.getOldPassword());
        }
        
        if (!oldPasswordMatches) {
            log.warn("Tentative de changement de mot de passe avec un ancien mot de passe incorrect pour l'ID: {}", id);
            throw new BadRequestException("L'ancien mot de passe est incorrect");
        }

        // Hasher le nouveau mot de passe avec BCrypt
        String hashedNewPassword = passwordEncoder.encode(request.getNewPassword());
        user.setMotDePasse(hashedNewPassword);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        log.info("Mot de passe changé avec succès pour l'utilisateur ID: {}", id);
    }

    /**
     * Supprime un utilisateur
     */
    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
        userRepository.delete(user);
        log.info("Utilisateur supprimé avec l'ID: {}", id);
    }

    /**
     * Recherche des utilisateurs
     */
    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query) {
        List<User> users = userRepository.searchUsers(query);
        return users.stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les utilisateurs par rôle
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(String role) {
        try {
            User.RoleUtilisateur userRole = User.RoleUtilisateur.valueOf(role.toUpperCase());
            List<User> users = userRepository.findByRole(userRole);
            return users.stream()
                    .map(UserResponse::fromEntity)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Rôle invalide: " + role);
        }
    }

    /**
     * Récupère les statistiques des utilisateurs
     */
    @Transactional(readOnly = true)
    public UserStatisticsResponse getUserStatistics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrue();
        long admins = userRepository.countByRole(User.RoleUtilisateur.ADMINISTRATEUR);
        long teachers = userRepository.countByRole(User.RoleUtilisateur.ENSEIGNANT);

        return UserStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .admins(admins)
                .managers(0L) 
                .regularUsers(teachers) 
                .build();
    }

    /**
     * Active un utilisateur
     */
    public UserResponse activateUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
        user.setIsActive(true);
        User updatedUser = userRepository.save(user);
        log.info("Utilisateur activé avec l'ID: {}", id);
        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Désactive un utilisateur
     */
    public UserResponse deactivateUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
        user.setIsActive(false);
        User updatedUser = userRepository.save(user);
        log.info("Utilisateur désactivé avec l'ID: {}", id);
        
        // Envoyer un email de notification de blocage
        try {
            notificationClient.sendAccountBlockedEmail(
                user.getEmail(),
                user.getPrenom(),
                user.getNom()
            );
            log.info(" Email de notification de blocage envoyé à: {}", user.getEmail());
        } catch (Exception e) {
            log.error(" Erreur lors de l'envoi de l'email de blocage à {}: {}", user.getEmail(), e.getMessage());
            // Ne pas faire échouer la désactivation si l'email échoue
        }
        
        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Met à jour la date de dernière connexion
     */
    public void updateLastLogin(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Demande de réinitialisation de mot de passe
     * Génère un code à 6 chiffres et l'envoie par email
     */
    public void requestPasswordReset(String email) {
        log.info(" Demande de réinitialisation de mot de passe pour: {}", email);
        
        // Vérifier que l'utilisateur existe
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn(" Utilisateur non trouvé pour l'email: {}", email);
                    return new ResourceNotFoundException("Utilisateur", "email: " + email);
                });
        
        // Vérifier que le compte est actif
        if (!user.getIsActive()) {
            log.warn(" Tentative de réinitialisation pour un compte inactif: {}", email);
            throw new BadRequestException("Votre compte est désactivé. Veuillez contacter un administrateur.");
        }
        
        // Supprimer les anciens tokens de cet email
        passwordResetTokenRepository.deleteByEmail(email);
        
        // Générer un code à 6 chiffres
        String code = generateResetCode();
        
        // Créer le token (valide 15 minutes)
        PasswordResetToken token = PasswordResetToken.builder()
                .email(email)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();
        
        passwordResetTokenRepository.save(token);
        log.info(" Code de réinitialisation généré pour: {}", email);
        
        // Envoyer le code par email
        try {
            notificationClient.sendResetCodeEmail(
                email,
                user.getPrenom(),
                user.getNom(),
                code
            );
            log.info(" Email avec code de réinitialisation envoyé à: {}", email);
        } catch (Exception e) {
            log.error(" Erreur lors de l'envoi de l'email à {}: {}", email, e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email. Veuillez réessayer.");
        }
    }
    
    /**
     * Vérifie le code de réinitialisation et génère un nouveau mot de passe
     */
    public ResetPasswordResponse verifyResetCodeAndResetPassword(String email, String code) {
        log.info(" Vérification du code de réinitialisation pour: {}", email);
        
        // Vérifier que l'utilisateur existe
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn(" Utilisateur non trouvé pour l'email: {}", email);
                    return new ResourceNotFoundException("Utilisateur", "email: " + email);
                });
        
        // Trouver le token
        PasswordResetToken token = passwordResetTokenRepository.findByEmailAndCode(email, code)
                .orElseThrow(() -> {
                    log.warn(" Code de réinitialisation invalide pour: {}", email);
                    return new BadRequestException("Code de vérification invalide");
                });
        
        // Vérifier que le token est valide
        if (!token.isValid()) {
            if (token.getUsed()) {
                log.warn(" Code déjà utilisé pour: {}", email);
                throw new BadRequestException("Ce code a déjà été utilisé");
            } else {
                log.warn(" Code expiré pour: {}", email);
                throw new BadRequestException("Ce code a expiré. Veuillez demander un nouveau code.");
            }
        }
        
        // Générer un nouveau mot de passe
        String newPassword = passwordGeneratorService.generatePassword();
        String hashedPassword = passwordEncoder.encode(newPassword);
        
        // Mettre à jour le mot de passe
        user.setMotDePasse(hashedPassword);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        
        // Marquer le token comme utilisé
        token.setUsed(true);
        passwordResetTokenRepository.save(token);
        
        log.info(" Mot de passe réinitialisé avec succès pour: {}", email);
        
        // Envoyer le nouveau mot de passe par email
        try {
            notificationClient.sendPasswordEmail(
                email,
                user.getPrenom(),
                user.getNom(),
                newPassword
            );
            log.info(" Email avec nouveau mot de passe envoyé à: {}", email);
        } catch (Exception e) {
            log.error(" Erreur lors de l'envoi de l'email à {}: {}", email, e.getMessage());
            // Ne pas faire échouer la réinitialisation si l'email échoue
        }
        
        return ResetPasswordResponse.builder()
                .message("Votre mot de passe a été réinitialisé avec succès. Un email contenant votre nouveau mot de passe vous a été envoyé.")
                .newPassword(newPassword)
                .build();
    }
    
    /**
     * Génère un code de réinitialisation à 6 chiffres
     */
    private String generateResetCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // Génère un nombre entre 100000 et 999999
        return String.valueOf(code);
    }
    
    /**
     * Réinitialise le mot de passe d'un utilisateur (appelé par Auth Service)
     */
    public void resetPassword(String userId, String newPassword) {
        log.info(" Réinitialisation du mot de passe pour l'utilisateur: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID: " + userId));
        
        // Encoder le nouveau mot de passe
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setMotDePasse(encodedPassword);
        
        userRepository.save(user);
        log.info(" Mot de passe réinitialisé pour l'utilisateur: {}", userId);
    }
}
