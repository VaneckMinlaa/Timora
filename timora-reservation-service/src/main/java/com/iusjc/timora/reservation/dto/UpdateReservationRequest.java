package com.iusjc.timora.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO pour mettre à jour une demande de réservation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReservationRequest {

    private String salleId;

    private LocalDate date;

    private LocalTime heureDebut;

    private LocalTime heureFin;

    private String coursId;

    private String evenementId;

    private String purpose;

    private Integer numberOfParticipants;

    private String notes;

    private String equipementId;

    private String equipementNom;
}
