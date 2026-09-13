package com.iusjc.timora.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Entité User pour la gestion des utilisateurs
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_email", columnList = "email", unique = true),
    @Index(name = "idx_role", columnList = "role"),
    @Index(name = "idx_active", columnList = "isActive")
})
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "user_type", discriminatorType = DiscriminatorType.STRING)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_utilisateur")
    private String idUtilisateur;  

    @Column(nullable = false)
    private String nom;  
    @Column(nullable = false)
    private String prenom;  

    @Column(nullable = false, unique = true)
    private String email;

    private Integer telephone;  

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleUtilisateur role;  

    @Column(nullable = false)
    private String motDePasse;  

    // Champs additionnels pour la gestion
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    private String department;

    private String organization;

    @Column(columnDefinition = "TEXT")
    private String profilePicture;

    private LocalDateTime lastLogin;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum RoleUtilisateur {
        ADMINISTRATEUR,  
        ENSEIGNANT      
    }
}

