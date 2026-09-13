package com.iusjc.timora.schedule.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Cours 
 */
@Entity
@Table(name = "cours")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cours {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_cours", length = 36)
    private String idCours;  

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeCours type;  
    @Column(nullable = false)
    private String nom;

    // Pour les cours spéciaux 
    private Boolean estSpecial; 
    private String description;
    

    // Références aux autres entités
    private String emploiDuTempsId;  
    // Relation 1 Cours -> 0..* UE 
    @ElementCollection
    @CollectionTable(name = "cours_ues", joinColumns = @JoinColumn(name = "cours_id"))
    @Column(name = "ue_id")
    @Builder.Default
    private List<String> ueIds = new ArrayList<>();  
    
    // Relation 1 Cours -> 1..* Classe 
    @ElementCollection
    @CollectionTable(name = "cours_classes", joinColumns = @JoinColumn(name = "cours_id"))
    @Column(name = "classe_id")
    @Builder.Default
    private List<String> classeIds = new ArrayList<>(); 
    
    private String enseignantId; 
    private String salleId;  
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Semestre semestre;

    private String niveau;
    
    @Column(nullable = false)
    private Integer credits;    

    // Suivi du volume horaire semestriel
    private Integer volumeTotal;
    private Integer volumeRestant;

    // Champs pour l'emploi du temps
    @Column(name = "jour_semaine")
    private String jourSemaine;
    
    @Column(name = "heure_debut")
    private java.time.LocalTime heureDebut;
    
    @Column(name = "heure_fin")
    private java.time.LocalTime heureFin;

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

