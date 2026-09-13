package com.iusjc.timora.reservation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Entité DemandeDeReservation selon le diagramme de classe UML
 */
@Entity
@Table(name = "demandes_reservation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeDeReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_demande_reservation")
    private String idDemandeReservation; 

    @Column(nullable = false)
    private LocalDate date;  

    @Column(nullable = false)
    private LocalTime heuredebut;  

    @Column(nullable = false)
    private LocalTime heureFin;  

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutReservation statut;  

    // Références aux autres entités (via IDs pour éviter les dépendances inter-services)
    @Column(nullable = false)
    private String utilisateurId;  

    @Column(nullable = false)
    private String salleId;  

    private String coursId;  

    private String evenementId;  

    @Column(length = 500)
    private String purpose; 

    @Column
    private Integer numberOfParticipants; 

    @Column(length = 1000)
    private String notes;  

    private String equipementId; 

    private String equipementNom; 

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

