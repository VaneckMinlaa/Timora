package com.iusjc.timora.reporting.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité Configuration s
 * Permet de stocker les paramètres de configuration du système
 */
@Entity
@Table(name = "configurations", indexes = {
    @Index(name = "idx_cle", columnList = "cle", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Configuration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String cle;  // Clé de configuration (ex: "serveurEmail", "seuilQuotaHoraire", "adresseServeur")

    @Column(nullable = false, columnDefinition = "TEXT")
    private String valeur;  
    private String description;  

    @Transient
    private String serveurEmail;  

    @Transient
    private Integer seuilQuotaHoraire;  

    @Transient
    private String adresseServeur;  

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
}

