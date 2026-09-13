package com.iusjc.timora.reservation.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Fallback pour RoomServiceClient en cas d'erreur de communication
 */
@Slf4j
@Component
public class RoomServiceClientFallback implements RoomServiceClient {

    @Override
    public Map<String, Object> getRoomById(String roomId) {
        log.warn("RoomServiceClient fallback: Impossible de récupérer la salle {}", roomId);
        return Collections.emptyMap();
    }

    @Override
    public Map<String, Object> checkRoomAvailability(String roomId, String date) {
        log.warn("RoomServiceClient fallback: Impossible de vérifier la disponibilité de la salle {}", roomId);
        // Retourner une disponibilité par défaut (disponible) en cas de fallback
        return Map.of("available", true);
    }

    @Override
    public List<Map<String, Object>> getAllRooms(String type, Integer capacity) {
        log.warn("RoomServiceClient fallback: Impossible de récupérer les salles (type={}, capacity={})", type, capacity);
        return Collections.emptyList();
    }
}
