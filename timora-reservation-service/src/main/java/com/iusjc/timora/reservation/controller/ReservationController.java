package com.iusjc.timora.reservation.controller;

import com.iusjc.timora.reservation.dto.CreateReservationRequest;
import com.iusjc.timora.reservation.dto.ReservationResponse;
import com.iusjc.timora.reservation.dto.RoomAvailabilityDTO;
import com.iusjc.timora.reservation.dto.RoomSuggestionResponse;
import com.iusjc.timora.reservation.dto.UpdateReservationRequest;
import com.iusjc.timora.reservation.service.RealTimeAvailabilityService;
import com.iusjc.timora.reservation.service.ReservationService;
import com.iusjc.timora.reservation.service.RoomAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la gestion des réservations (DemandeDeReservation)
 * Endpoints:
 * - GET    /api/reservations
 * - GET    /api/reservations/:id
 * - POST   /api/reservations
 * - PUT    /api/reservations/:id
 * - DELETE /api/reservations/:id
 * - PATCH  /api/reservations/:id/confirm
 * - PATCH  /api/reservations/:id/cancel
 * - GET    /api/reservations/user/:userId
 * - GET    /api/reservations/room/:roomId
 * - GET    /api/reservations/date-range?startDate=xxx&endDate=xxx
 * - GET    /api/reservations/check-availability?roomId=xxx&date=xxx&startTime=xxx&endTime=xxx
 */
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReservationController {

    private final ReservationService reservationService;
    private final RoomAssignmentService roomAssignmentService;
    private final RealTimeAvailabilityService realTimeAvailabilityService;

    /**
     * Créer une demande de réservation
     * POST /api/reservations
     * Méthode selon UML : +creerReservation(): void
     */
    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody CreateReservationRequest request) {
        log.info("POST /api/reservations - Création d'une réservation");
        ReservationResponse response = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Récupérer toutes les réservations
     * GET /api/reservations
     */
    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getAllReservations() {
        log.info("GET /api/reservations - Récupération de toutes les réservations");
        List<ReservationResponse> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(reservations);
    }

    /**
     * Récupérer une réservation par ID
     * GET /api/reservations/:id
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable String id) {
        log.info("GET /api/reservations/{}", id);
        ReservationResponse reservation = reservationService.getReservationById(id);
        return ResponseEntity.ok(reservation);
    }

    /**
     * Mettre à jour une réservation
     * PUT /api/reservations/:id
     */
    @PutMapping("/{id}")
    public ResponseEntity<ReservationResponse> updateReservation(
            @PathVariable String id,
            @Valid @RequestBody UpdateReservationRequest request) {
        log.info("PUT /api/reservations/{} - Mise à jour d'une réservation", id);
        ReservationResponse response = reservationService.updateReservation(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Supprimer une réservation
     * DELETE /api/reservations/:id
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable String id) {
        log.info("DELETE /api/reservations/{} - Suppression d'une réservation", id);
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Annuler une réservation
     * PATCH /api/reservations/:id/cancel
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ReservationResponse> cancelReservation(@PathVariable String id) {
        log.info("PATCH /api/reservations/{}/cancel - Annulation d'une réservation", id);
        ReservationResponse response = reservationService.cancelReservation(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Confirmer une réservation
     * PATCH /api/reservations/:id/confirm
     */
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<ReservationResponse> confirmReservation(@PathVariable String id) {
        log.info("PATCH /api/reservations/{}/confirm - Confirmation d'une réservation", id);
        ReservationResponse response = reservationService.confirmReservation(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Récupérer les réservations d'un utilisateur
     * GET /api/reservations/user/:userId
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationResponse>> getUserReservations(
            @PathVariable String userId) {
        log.info("GET /api/reservations/user/{}", userId);
        List<ReservationResponse> reservations = reservationService.getUserReservations(userId);
        return ResponseEntity.ok(reservations);
    }

    /**
     * Récupérer les réservations d'une salle
     * GET /api/reservations/room/:roomId?startDate=xxx&endDate=xxx
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<ReservationResponse>> getRoomReservations(
            @PathVariable String roomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/reservations/room/{}", roomId);
        List<ReservationResponse> reservations = reservationService.getRoomReservations(roomId, startDate, endDate);
        return ResponseEntity.ok(reservations);
    }

    /**
     * Récupérer les réservations par plage de dates
     * GET /api/reservations/date-range?startDate=xxx&endDate=xxx
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<ReservationResponse>> getReservationsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/reservations/date-range?startDate={}&endDate={}", startDate, endDate);
        List<ReservationResponse> reservations = reservationService.getReservationsByDateRange(startDate, endDate);
        return ResponseEntity.ok(reservations);
    }

    /**
     * Vérifier la disponibilité d'une salle
     * GET /api/reservations/check-availability?roomId=xxx&date=xxx&startTime=xxx&endTime=xxx
     */
    @GetMapping("/check-availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam String roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        log.info("GET /api/reservations/check-availability?roomId={}&date={}&startTime={}&endTime={}", 
                 roomId, date, startTime, endTime);
        boolean available = reservationService.checkAvailability(roomId, date, startTime, endTime);
        return ResponseEntity.ok(Map.of("available", available, "roomId", roomId, 
                                        "date", date.toString(), "startTime", startTime.toString(), 
                                        "endTime", endTime.toString()));
    }

    /**
     * Suggérer des salles automatiquement en fonction du type de cours et de la taille du groupe
     * GET /api/reservations/suggest-rooms?typeCours=xxx&numberOfParticipants=xxx&date=xxx&startTime=xxx&endTime=xxx
     */
    @GetMapping("/suggest-rooms")
    public ResponseEntity<List<RoomSuggestionResponse>> suggestRooms(
            @RequestParam String typeCours,
            @RequestParam Integer numberOfParticipants,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        log.info("GET /api/reservations/suggest-rooms?typeCours={}&numberOfParticipants={}&date={}&startTime={}&endTime={}", 
                 typeCours, numberOfParticipants, date, startTime, endTime);
        List<RoomSuggestionResponse> suggestions = roomAssignmentService.suggestRooms(
                typeCours, numberOfParticipants, date, startTime, endTime);
        return ResponseEntity.ok(suggestions);
    }

    /**
     * Vérifier la disponibilité en temps réel d'une salle
     * GET /api/reservations/realtime-availability?roomId=xxx&date=xxx&startTime=xxx&endTime=xxx
     */
    @GetMapping("/realtime-availability")
    public ResponseEntity<RoomAvailabilityDTO> getRealTimeAvailability(
            @RequestParam String roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        log.info("GET /api/reservations/realtime-availability?roomId={}&date={}&startTime={}&endTime={}", 
                 roomId, date, startTime, endTime);
        RoomAvailabilityDTO availability = realTimeAvailabilityService.checkRealTimeAvailability(
                roomId, date, startTime, endTime);
        return ResponseEntity.ok(availability);
    }

    /**
     * Obtenir la disponibilité en temps réel de toutes les salles pour une période donnée
     * GET /api/reservations/realtime-availability/all?date=xxx&startTime=xxx&endTime=xxx
     */
    @GetMapping("/realtime-availability/all")
    public ResponseEntity<List<RoomAvailabilityDTO>> getAllRoomsRealTimeAvailability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        log.info("GET /api/reservations/realtime-availability/all?date={}&startTime={}&endTime={}", 
                 date, startTime, endTime);
        List<RoomAvailabilityDTO> availabilities = realTimeAvailabilityService.getAllRoomsRealTimeAvailability(
                date, startTime, endTime);
        return ResponseEntity.ok(availabilities);
    }

    /**
     * Obtenir la disponibilité en temps réel d'une salle pour une journée complète
     * GET /api/reservations/realtime-availability/room/:roomId/day?date=xxx
     */
    @GetMapping("/realtime-availability/room/{roomId}/day")
    public ResponseEntity<List<RoomAvailabilityDTO>> getRoomAvailabilityForDay(
            @PathVariable String roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("GET /api/reservations/realtime-availability/room/{}/day?date={}", roomId, date);
        List<RoomAvailabilityDTO> availabilities = realTimeAvailabilityService.getRoomAvailabilityForDay(roomId, date);
        return ResponseEntity.ok(availabilities);
    }
}
