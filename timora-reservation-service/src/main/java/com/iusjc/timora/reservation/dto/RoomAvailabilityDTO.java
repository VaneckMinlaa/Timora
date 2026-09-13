package com.iusjc.timora.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO pour la disponibilité en temps réel d'une salle
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomAvailabilityDTO {
    private String roomId;
    private String roomName;
    private Boolean available;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private List<ReservationConflictDTO> conflicts; // Conflits existants si non disponible
    private Long lastUpdated; // Timestamp de dernière mise à jour
}
