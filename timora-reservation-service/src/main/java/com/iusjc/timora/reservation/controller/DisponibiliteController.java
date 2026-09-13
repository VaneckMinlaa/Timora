package com.iusjc.timora.reservation.controller;

import com.iusjc.timora.reservation.dto.CreateDisponibiliteRequest;
import com.iusjc.timora.reservation.dto.DisponibiliteResponse;
import com.iusjc.timora.reservation.dto.UpdateDisponibiliteRequest;
import com.iusjc.timora.reservation.service.DisponibiliteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Contrôleur REST pour la gestion des disponibilités 
 * Endpoints:
 * - GET    /api/reservations/disponibilites/user/:userId
 * - GET    /api/reservations/disponibilites/:id
 * - POST   /api/reservations/disponibilites
 * - PUT    /api/reservations/disponibilites/:id
 * - DELETE /api/reservations/disponibilites/:id
 * - GET    /api/reservations/disponibilites/day/:jour
 * - GET    /api/reservations/disponibilites/emploi-du-temps/:edtId
 */
@RestController
@RequestMapping("/api/reservations/disponibilites")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DisponibiliteController {

    private final DisponibiliteService disponibiliteService;

    /**
     * Créer une disponibilité
     * POST /api/reservations/disponibilites
     * Méthode selon UML : +creerDispo(jour: DateTime, heureDebut: DateTime, heureFin: DateTime)
     */
    @PostMapping
    public ResponseEntity<DisponibiliteResponse> createDisponibilite(
            @Valid @RequestBody CreateDisponibiliteRequest request) {
        log.info("POST /api/reservations/disponibilites - Création d'une disponibilité");
        DisponibiliteResponse response = disponibiliteService.createDisponibilite(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Récupérer toutes les disponibilités d'un utilisateur
     * GET /api/reservations/disponibilites/user/:userId
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DisponibiliteResponse>> getDisponibilitesByUserId(
            @PathVariable String userId) {
        log.info("GET /api/reservations/disponibilites/user/{}", userId);
        List<DisponibiliteResponse> disponibilites = disponibiliteService.getDisponibilitesByUserId(userId);
        return ResponseEntity.ok(disponibilites);
    }

    /**
     * Récupérer une disponibilité par ID
     * GET /api/reservations/disponibilites/:id
     */
    @GetMapping("/{id}")
    public ResponseEntity<DisponibiliteResponse> getDisponibiliteById(@PathVariable String id) {
        log.info("GET /api/reservations/disponibilites/{}", id);
        DisponibiliteResponse disponibilite = disponibiliteService.getDisponibiliteById(id);
        return ResponseEntity.ok(disponibilite);
    }

    /**
     * Mettre à jour une disponibilité
     * PUT /api/reservations/disponibilites/:id
     * Méthode selon UML : +modifierDispo()
     */
    @PutMapping("/{id}")
    public ResponseEntity<DisponibiliteResponse> updateDisponibilite(
            @PathVariable String id,
            @Valid @RequestBody UpdateDisponibiliteRequest request) {
        log.info("PUT /api/reservations/disponibilites/{}", id);
        DisponibiliteResponse response = disponibiliteService.updateDisponibilite(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Supprimer une disponibilité
     * DELETE /api/reservations/disponibilites/:id
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDisponibilite(@PathVariable String id) {
        log.info("DELETE /api/reservations/disponibilites/{}", id);
        disponibiliteService.deleteDisponibilite(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Récupérer les disponibilités par jour
     * GET /api/reservations/disponibilites/day/:jour?userId=xxx
     */
    @GetMapping("/day/{jour}")
    public ResponseEntity<List<DisponibiliteResponse>> getDisponibilitesByDay(
            @PathVariable String jour,
            @RequestParam(required = false) String userId) {
        log.info("GET /api/reservations/disponibilites/day/{}?userId={}", jour, userId);
        List<DisponibiliteResponse> disponibilites = disponibiliteService.getDisponibilitesByDay(jour, userId);
        return ResponseEntity.ok(disponibilites);
    }

    /**
     * Récupérer les disponibilités par EmploiDuTemps
     * GET /api/reservations/disponibilites/emploi-du-temps/:edtId
     */
    @GetMapping("/emploi-du-temps/{edtId}")
    public ResponseEntity<List<DisponibiliteResponse>> getDisponibilitesByEmploiDuTempsId(
            @PathVariable String edtId) {
        log.info("GET /api/reservations/disponibilites/emploi-du-temps/{}", edtId);
        List<DisponibiliteResponse> disponibilites = 
                disponibiliteService.getDisponibilitesByEmploiDuTempsId(edtId);
        return ResponseEntity.ok(disponibilites);
    }

    /**
     * Récupérer les disponibilités par utilisateur et plage de dates
     * GET /api/reservations/disponibilites/user/:userId/range?startDate=xxx&endDate=xxx
     */
    @GetMapping("/user/{userId}/range")
    public ResponseEntity<List<DisponibiliteResponse>> getDisponibilitesByUserIdAndDateRange(
            @PathVariable String userId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        log.info("GET /api/reservations/disponibilites/user/{}/range?startDate={}&endDate={}", 
                userId, startDate, endDate);
        List<DisponibiliteResponse> disponibilites = 
                disponibiliteService.getDisponibilitesByUserIdAndDateRange(userId, startDate, endDate);
        return ResponseEntity.ok(disponibilites);
    }

    /**
     * Récupérer toutes les disponibilités par plage de dates (pour admin)
     * GET /api/reservations/disponibilites/all/range?startDate=xxx&endDate=xxx
     */
    @GetMapping("/all/range")
    public ResponseEntity<List<DisponibiliteResponse>> getAllDisponibilitesByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        log.info("GET /api/reservations/disponibilites/all/range?startDate={}&endDate={}", 
                startDate, endDate);
        List<DisponibiliteResponse> disponibilites = 
                disponibiliteService.getAllDisponibilitesByDateRange(startDate, endDate);
        return ResponseEntity.ok(disponibilites);
    }
}

