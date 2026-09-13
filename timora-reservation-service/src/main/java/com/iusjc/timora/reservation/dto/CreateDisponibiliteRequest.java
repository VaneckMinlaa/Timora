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
 * DTO pour créer une disponibilité
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDisponibiliteRequest {

    @NotBlank(message = "Le jour de la semaine est obligatoire")
    private String jour;  

    @NotNull(message = "La date est obligatoire")
    private LocalDate date; 

    @NotNull(message = "L'heure de début est obligatoire")
    private LocalTime heureDebut; 

    @NotNull(message = "L'heure de fin est obligatoire")
    private LocalTime heureFin;  

    @NotBlank(message = "L'ID utilisateur est obligatoire")
    private String utilisateurId;  

    private String emploiDuTempsId;  
}

