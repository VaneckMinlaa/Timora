package com.iusjc.timora.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO de réponse pour une disponibilité
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisponibiliteResponse {

    private String idDisponibilite;
    private String jour;  
    private LocalDate date; 
    private LocalTime heureDebut;  
    private LocalTime heureFin;  
    private String utilisateurId;  
    private String emploiDuTempsId;  
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

