package com.iusjc.timora.schedule.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

/**
 * Client Feign pour la communication avec RoomService
 */
@FeignClient(
    name = "TIMORA-ROOM-SERVICE",
    path = "/api/rooms"
)
public interface RoomServiceClient {

    /**
     * Récupère une salle par ID
     */
    @GetMapping("/{id}")
    Map<String, Object> getRoomById(@PathVariable("id") String roomId);

    /**
     * Récupère toutes les salles
     */
    @GetMapping
    List<Map<String, Object>> getAllRooms();


    /**
     * Récupère les salles disponibles par type
     */
    @GetMapping("/available")
    List<Map<String, Object>> getAvailableRoomsByType(
            @RequestParam("type") String typeSalle,
            @RequestParam(value = "capaciteMin", required = false) Integer capaciteMin);

    /**
     * Vérifie la disponibilité d'une salle pour un horaire
     */
    @GetMapping("/{id}/availability")
    Map<String, Object> checkRoomAvailability(
            @PathVariable("id") String roomId,
            @RequestParam("date") String date,
            @RequestParam("heureDebut") String heureDebut,
            @RequestParam("heureFin") String heureFin);
}
