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
 * Entité Disponibilite 
 */
@Entity
@Table(name = "disponibilites")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Disponibilite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_disponibilite")
    private String idDisponibilite;  

    @Column(nullable = false)
    private String jour;  

    @Column(nullable = true) 
    private LocalDate date;  

    @Column(nullable = false)
    private LocalTime heureDebut;  

    @Column(nullable = false)
    private LocalTime heureFin;  

    // Référence à l'utilisateur (enseignant) 
    @Column(nullable = false)
    private String utilisateurId;  

    // Référence optionnelle à EmploiDuTemps (dans ScheduleService)
    private String emploiDuTempsId;

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

