package com.iusjc.timora.user.dto;

import com.iusjc.timora.user.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO de réponse pour un utilisateur
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    @Schema(description = "Rôle de l'utilisateur", allowableValues = {"ADMINISTRATEUR", "ENSEIGNANT", "ETUDIANT"}, implementation = String.class)
    private User.RoleUtilisateur role;
    private Boolean isActive;
    private String department;
    private List<String> schools;
    private String profilePicture;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String status;
    
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getIdUtilisateur())
                .email(user.getEmail())
                .firstName(user.getPrenom())  // prenom -> firstName pour compatibilité API
                .lastName(user.getNom())  // nom -> lastName pour compatibilité API
                .phone(user.getTelephone() != null ? user.getTelephone().toString() : null)
                .role(user.getRole())
                .isActive(user.getIsActive())
                .department(user.getDepartment())
                .schools(parseSchools(user.getOrganization()))
                .profilePicture(user.getProfilePicture())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .status(user.getIsActive() ? "Actif" : "Inactif")
                .build();
    }

    /**
     * Parse la chaîne d'organisations en liste d'écoles
     */
    private static List<String> parseSchools(String organization) {
        if (organization == null || organization.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(organization.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}

