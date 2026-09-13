package com.iusjc.timora.room.controller;

import com.iusjc.timora.room.dto.CreateSalleRequest;
import com.iusjc.timora.room.dto.SalleResponse;
import com.iusjc.timora.room.dto.UpdateSalleRequest;
import com.iusjc.timora.room.entity.Salle;
import com.iusjc.timora.room.entity.TypeSalle;
import com.iusjc.timora.room.service.SalleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôleur REST pour la gestion des salles
 * Endpoints:
 * - GET    /api/rooms
 * - GET    /api/rooms/:id
 * - POST   /api/rooms
 * - PUT    /api/rooms/:id
 * - DELETE /api/rooms/:id
 * - GET    /api/rooms/search?query=xxx
 * - GET    /api/rooms/available?startDate=xxx&endDate=xxx&capacity=xxx&type=xxx
 * - GET    /api/rooms/location/:location
 * - GET    /api/rooms/:id/availability?date=xxx
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SalleController {

    private final SalleService salleService;

    @Operation(summary = "Liste des salles", description = "Récupère toutes les salles avec filtres optionnels : capacity, location, type")
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Liste des salles") })
    @GetMapping
    public ResponseEntity<List<SalleResponse>> getAllSalles(
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) TypeSalle type) {
        log.info("GET /api/rooms - Récupération de toutes les salles");
        
        List<Salle> salles;
        
        // Appliquer les filtres
        if (type != null && capacity != null) {
            salles = salleService.getAvailableSalles(type, capacity);
        } else if (type != null) {
            salles = salleService.getSallesByType(type);
        } else if (capacity != null) {
            salles = salleService.getSallesByMinCapacity(capacity);
        } else {
            salles = salleService.getAllSalles();
        }
        
        List<SalleResponse> responses = salles.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Détail d'une salle", description = "Récupère une salle par son identifiant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Salle trouvée"),
            @ApiResponse(responseCode = "404", description = "Salle non trouvée")
    })
    @GetMapping("/{id}")
    public ResponseEntity<SalleResponse> getSalleById(@Parameter(description = "ID de la salle") @PathVariable String id) {
        log.info("GET /api/rooms/{}", id);
        Salle salle = salleService.getSalleById(id);
        return ResponseEntity.ok(mapToResponse(salle));
    }

    /**
     * Créer une salle
     * POST /api/rooms
     */
    @PostMapping
    public ResponseEntity<SalleResponse> createSalle(@Valid @RequestBody CreateSalleRequest request) {
        log.info("POST /api/rooms - Création d'une salle");
        Salle salle = Salle.builder()
            .nomsalle(request.getNomsalle())
            .capacite(request.getCapacite())
            .typeSalle(request.getTypeSalle())
            .ecole(request.getEcole())
            .build();
        Salle created = salleService.createSalle(salle);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(created));
    }

    @Operation(summary = "Modifier une salle", description = "Met à jour les informations d'une salle")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Salle mise à jour"),
            @ApiResponse(responseCode = "404", description = "Salle non trouvée")
    })
    @PutMapping("/{id}")
    public ResponseEntity<SalleResponse> updateSalle(
            @PathVariable String id,
            @Valid @RequestBody UpdateSalleRequest request) {
        log.info("PUT /api/rooms/{} - Mise à jour d'une salle", id);
        Salle salle = Salle.builder()
            .nomsalle(request.getNomsalle())
            .capacite(request.getCapacite())
            .typeSalle(request.getTypeSalle())
            .ecole(request.getEcole())
            .build();
        Salle updated = salleService.updateSalle(id, salle);
        return ResponseEntity.ok(mapToResponse(updated));
    }

    @Operation(summary = "Supprimer une salle", description = "Supprime définitivement une salle")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Salle supprimée"),
            @ApiResponse(responseCode = "404", description = "Salle non trouvée")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalle(@PathVariable String id) {
        log.info("DELETE /api/rooms/{} - Suppression d'une salle", id);
        salleService.deleteSalle(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Rechercher des salles par nom
     * GET /api/rooms/search?query=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<List<SalleResponse>> searchSalles(@RequestParam String query) {
        log.info("GET /api/rooms/search?query={}", query);
        List<Salle> salles = salleService.searchSalles(query);
        List<SalleResponse> responses = salles.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Récupérer les salles disponibles
     * GET /api/rooms/available?startDate=xxx&endDate=xxx&capacity=xxx&type=xxx
     * Note: La disponibilité réelle doit être vérifiée via le service de réservation
     */
    @GetMapping("/available")
    public ResponseEntity<List<SalleResponse>> getAvailableSalles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) TypeSalle type) {
        log.info("GET /api/rooms/available - Récupération des salles disponibles");
        
        // Pour l'instant, on filtre uniquement par capacité et type
        // La vérification de disponibilité réelle sera faite via le service de réservation
        List<Salle> salles = salleService.getAvailableSalles(type, capacity);
        List<SalleResponse> responses = salles.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Vérifier la disponibilité d'une salle à une date donnée
     * GET /api/rooms/:id/availability?date=xxx
     * Note: Cette méthode devrait appeler le service de réservation pour vérifier les conflits
     */
    @GetMapping("/{id}/availability")
    public ResponseEntity<Map<String, Object>> getRoomAvailability(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("GET /api/rooms/{}/availability?date={}", id, date);
        
        // Vérifier que la salle existe
        Salle salle = salleService.getSalleById(id);
        
        // Pour l'instant, on retourne simplement que la salle existe
        // La vérification de disponibilité réelle devrait être faite via le service de réservation
        return ResponseEntity.ok(Map.of(
            "roomId", salle.getIdSalle(),
            "roomName", salle.getNomsalle(),
            "date", date.toString(),
            "available", true // Par défaut, on considère la salle disponible (la vérification réelle sera faite côté réservation)
        ));
    }

    /**
     * Récupérer les salles par école
     * GET /api/rooms/ecole/:ecole
     */
    @GetMapping("/ecole/{ecole}")
    public ResponseEntity<List<SalleResponse>> getSallesByEcole(@PathVariable String ecole) {
        log.info("GET /api/rooms/ecole/{}", ecole);
        // Pour l'instant, on retourne toutes les salles
        List<Salle> salles = salleService.getAllSalles();
        List<SalleResponse> responses = salles.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Importer des salles depuis un fichier Excel
     * POST /api/rooms/import
     */
    @PostMapping(value = "/import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> importSalles(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        log.info("POST /api/rooms/import - Import depuis Excel");
        java.util.List<com.iusjc.timora.room.entity.Salle> imported = salleService.importFromExcel(file);
        java.util.List<SalleResponse> responses = imported.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of(
            "message", responses.size() + " salle(s) importée(s) avec succès",
            "count", responses.size(),
            "data", responses
        ));
    }

    /**
     * Mapper une entité Salle en SalleResponse
     */
    private SalleResponse mapToResponse(Salle salle) {
        return SalleResponse.builder()
            .idSalle(salle.getIdSalle())
            .nomsalle(salle.getNomsalle())
            .capacite(salle.getCapacite())
            .typeSalle(salle.getTypeSalle())
            .ecole(salle.getEcole())
            .createdAt(salle.getCreatedAt())
            .updatedAt(salle.getUpdatedAt())
            .build();
    }
}
