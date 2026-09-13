package com.iusjc.timora.schedule.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entité EmploiDuTemps
 */
@Entity
@Table(name = "emplois_du_temps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmploiDuTemps {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, updatable = false, nullable = false)
    private String id; 

    @Column(nullable = false)
    private Integer semaine; 

    @Column(nullable = false)
    private LocalDate dateDebut;  

    @Column(nullable = false)
    private LocalDate dateFin;  

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutEmp statut;  

    @Builder.Default
    private Boolean heuresConsommees = false;

    // Référence à Enseignant (dans UserService)
    private String enseignantId;

    // Métadonnées nécessaires pour l'historique de la génération
    private String titre;
    private String ecoleNom;
    private String filiereNom;
    private String classeNom;
    private String semestre;
    private String classeId;

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
