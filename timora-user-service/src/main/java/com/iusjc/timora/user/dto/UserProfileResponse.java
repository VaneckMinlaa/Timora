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
 * DTO de réponse pour le profil utilisateur 
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    @Schema(description = "Rôle", allowableValues = {"ADMINISTRATEUR", "ENSEIGNANT", "ETUDIANT"}, implementation = String.class)
    private User.RoleUtilisateur role;
    private Boolean isActive;
    private String department;
    private List<String> schools;
    private String profilePicture;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String status;

    public static UserProfileResponse fromEntity(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        
        try {
            return UserProfileResponse.builder()
                    .id(user.getIdUtilisateur())
                    .email(user.getEmail())
                    .firstName(user.getPrenom() != null ? user.getPrenom() : "")  
                    .lastName(user.getNom() != null ? user.getNom() : "")  
                    .phone(user.getTelephone() != null ? user.getTelephone().toString() : null)
                    .role(user.getRole())
                    .isActive(user.getIsActive() != null ? user.getIsActive() : true)
                    .department(user.getDepartment())
                    .schools(parseSchools(user.getOrganization()))
                    .profilePicture(user.getProfilePicture())
                    .lastLogin(user.getLastLogin())
                    .createdAt(user.getCreatedAt())
                    .updatedAt(user.getUpdatedAt())
                    .status(user.getIsActive() != null && user.getIsActive() ? "Actif" : "Inactif")
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Error converting User to UserProfileResponse: " + e.getMessage(), e);
        }
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

