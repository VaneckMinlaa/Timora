package com.iusjc.timora.reservation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

/**
 * Client Feign pour communiquer avec Room Service
 * Permet de vérifier la disponibilité et récupérer les informations des salles
 */
@FeignClient(
    name = "TIMORA-ROOM-SERVICE",
    path = "/api/rooms",
    fallback = RoomServiceClientFallback.class
)
public interface RoomServiceClient {

    /**
     * Récupère une salle par ID
     * GET /api/rooms/:id
     * Note: Le Room Service retourne un ResponseEntity<SalleResponse>, 
     * mais Feign le désérialise automatiquement en Map<String, Object>
     */
    @GetMapping("/{id}")
    Map<String, Object> getRoomById(@PathVariable("id") String roomId);

    /**
     * Vérifie la disponibilité d'une salle
     * GET /api/rooms/:id/availability?date=xxx
     */
    @GetMapping("/{id}/availability")
    Map<String, Object> checkRoomAvailability(
            @PathVariable("id") String roomId,
            @RequestParam("date") String date
    );

    /**
     * Récupère toutes les salles avec filtres optionnels
     * GET /api/rooms?type=XXX&capacity=XXX
     */
    @GetMapping
    List<Map<String, Object>> getAllRooms(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer capacity
    );
}
