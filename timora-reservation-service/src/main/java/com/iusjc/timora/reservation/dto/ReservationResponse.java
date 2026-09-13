package com.iusjc.timora.reservation.dto;

import com.iusjc.timora.reservation.entity.StatutReservation;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO pour la réponse d'une demande de réservation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    private String idDemandeReservation;

    private String salleId;

    private String salleNom;  

    private String utilisateurId;

    private String utilisateurNom;  

    private LocalDate date;

    private LocalTime heureDebut;

    private LocalTime heureFin;

    @Schema(implementation = String.class, allowableValues = {"CONFIRME", "ANNULEE", "EN_ATTENTE", "CONFLIT"})
    private StatutReservation statut;

    private String coursId;

    private String coursNom;  

    private String evenementId;

    private String evenementNom;  

    private String purpose;

    private Integer numberOfParticipants;

    private String notes;

    private String equipementId;

    private String equipementNom;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
