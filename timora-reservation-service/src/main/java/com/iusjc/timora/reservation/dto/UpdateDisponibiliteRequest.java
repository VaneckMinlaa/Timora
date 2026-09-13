package com.iusjc.timora.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * DTO pour mettre à jour une disponibilité
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDisponibiliteRequest {

    private String jour; 

    private LocalTime heureDebut; 

    private LocalTime heureFin; 

    private String emploiDuTempsId;  
}

