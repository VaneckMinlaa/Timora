package com.iusjc.timora.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO pour créer une demande de réservation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReservationRequest {

    private String salleId;

    @NotBlank(message = "L'ID de l'utilisateur est obligatoire")
    private String utilisateurId;

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    @NotNull(message = "L'heure de début est obligatoire")
    private LocalTime heureDebut;

    @NotNull(message = "L'heure de fin est obligatoire")
    private LocalTime heureFin;

    private String coursId;  

    private String typeCours;  

    private String evenementId;  

    private String purpose;  

    private Integer numberOfParticipants;  

    private String notes;

    private String equipementId;

    private String equipementNom;
}
