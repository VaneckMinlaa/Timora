package com.iusjc.timora.reservation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Evenement
 */
@Entity
@Table(name = "evenements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evenement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_even")
    private String idEven;  

    @Column(nullable = false)
    private String nom;  

    @Column(nullable = false)
    private String etat;  

    // Références aux autres entités
    private String salleId;  // Référence à Salle (dans RoomService)
    
    
    @ElementCollection
    @CollectionTable(name = "evenement_equipements", joinColumns = @JoinColumn(name = "evenement_id"))
    @Column(name = "equipement_id")
    @Builder.Default
    private List<String> equipementIds = new ArrayList<>();  // Références à Equipement (dans RoomService)
    
    // Relation 1 Evenement -> 1..* Enseignant 
    @ElementCollection
    @CollectionTable(name = "evenement_enseignants", joinColumns = @JoinColumn(name = "evenement_id"))
    @Column(name = "enseignant_id")
    @Builder.Default
    private List<String> enseignantIds = new ArrayList<>();  // Références à Enseignant (dans UserService)

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

