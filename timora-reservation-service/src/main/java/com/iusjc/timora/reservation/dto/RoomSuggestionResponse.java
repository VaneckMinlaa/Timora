package com.iusjc.timora.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour les suggestions de salles
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomSuggestionResponse {
    private String roomId;
    private String roomName;
    private String roomType;
    private Integer capacity;
    private Boolean suitable; // Indique si la salle est adaptée (capacité suffisante)
}
