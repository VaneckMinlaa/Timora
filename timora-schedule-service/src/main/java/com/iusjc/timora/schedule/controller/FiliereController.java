package com.iusjc.timora.schedule.controller;

import com.iusjc.timora.schedule.dto.ClasseResponse;
import com.iusjc.timora.schedule.dto.CreateClasseRequest;
import com.iusjc.timora.schedule.dto.CreateFiliereRequest;
import com.iusjc.timora.schedule.dto.FiliereResponse;
import com.iusjc.timora.schedule.service.FiliereService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la gestion des filières
 */
@RestController
@RequestMapping("/api/schedules/filieres")
@RequiredArgsConstructor
@Slf4j
public class FiliereController {

    private final FiliereService filiereService;

    /**
     * GET /api/schedules/filieres
     * Récupère toutes les filières
     */
    @GetMapping
    public ResponseEntity<List<FiliereResponse>> getAllFilieres() {
        List<FiliereResponse> filieres = filiereService.getAllFilieres();
        return ResponseEntity.ok(filieres);
    }

    /**
     * GET /api/schedules/filieres/{id}
     * Récupère une filière par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<FiliereResponse> getFiliereById(@PathVariable String id) {
        FiliereResponse filiere = filiereService.getFiliereById(id);
        return ResponseEntity.ok(filiere);
    }

    /**
     * GET /api/schedules/filieres/{id}/classes
     * Récupère toutes les classes d'une filière
     */
    @GetMapping("/{id}/classes")
    public ResponseEntity<List<com.iusjc.timora.schedule.dto.ClasseResponse>> getClassesByFiliere(@PathVariable String id) {
        List<com.iusjc.timora.schedule.dto.ClasseResponse> classes = filiereService.getClassesByFiliere(id);
        return ResponseEntity.ok(classes);
    }

    /**
     * GET /api/schedules/filieres/classes
     * Récupère toutes les classes (toutes filières confondues)
     */
    @GetMapping("/classes")
    public ResponseEntity<List<com.iusjc.timora.schedule.dto.ClasseResponse>> getAllClasses() {
        List<com.iusjc.timora.schedule.dto.ClasseResponse> classes = filiereService.getAllClasses();
        return ResponseEntity.ok(classes);
    }

    /**
     * GET /api/schedules/filieres/{id}/ues
     * Récupère toutes les UEs d'une filière
     */
    @GetMapping("/{id}/ues")
    public ResponseEntity<List<com.iusjc.timora.schedule.dto.UEResponse>> getUEsByFiliere(@PathVariable String id) {
        List<com.iusjc.timora.schedule.dto.UEResponse> ues = filiereService.getUEsByFiliere(id);
        return ResponseEntity.ok(ues);
    }

    /**
     * POST /api/schedules/filieres
     * Crée une nouvelle filière
     */
    @PostMapping
    public ResponseEntity<FiliereResponse> createFiliere(@Valid @RequestBody CreateFiliereRequest request) {
        FiliereResponse filiere = filiereService.createFiliere(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(filiere);
    }

    /**
     * DELETE /api/schedules/filieres/{id}
     * Supprime une filière
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFiliere(@PathVariable String id) {
        filiereService.deleteFiliere(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Créer une classe", description = "Crée une nouvelle classe pour une filière donnée")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Classe créée", content = @Content(schema = @Schema(implementation = ClasseResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données invalides")
    })
    @PostMapping("/{id}/classes")
    public ResponseEntity<?> createClasse(
            @PathVariable String id,
            @RequestBody CreateClasseRequest request) {
        try {
            log.info("Tentative de création d'une classe pour la filière {}: nom={}, effectif={}, ecoleId={}", 
                    id, request.getNom(), request.getEffectif(), request.getEcoleId());
            
            // S'assurer que la filière dans la requête correspond à celle dans l'URL
            request.setFiliereId(id);
            
            // Valider manuellement après avoir défini le filiereId
            if (request.getNom() == null || request.getNom().trim().isEmpty()) {
                log.warn("Validation échouée: nom manquant ou vide");
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Le nom de la classe est requis", "status", 400));
            }
            if (request.getEffectif() == null || request.getEffectif() < 1) {
                log.warn("Validation échouée: effectif invalide ({})", request.getEffectif());
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "L'effectif doit être un nombre supérieur à 0", "status", 400));
            }
            if (request.getEcoleId() == null || request.getEcoleId().trim().isEmpty()) {
                log.warn("Validation échouée: ecoleId manquant ou vide");
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "L'ID de l'école est requis", "status", 400));
            }
            
            com.iusjc.timora.schedule.dto.ClasseResponse classe = filiereService.createClasse(request);
            log.info("Classe créée avec succès: {}", classe.getIdClasse());
            return ResponseEntity.status(HttpStatus.CREATED).body(classe);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de la classe: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Erreur lors de la création de la classe", "status", 400));
        }
    }

    /**
     * PUT /api/schedules/filieres/{id}
     * Met à jour une filière
     */
    @PutMapping("/{id}")
    public ResponseEntity<FiliereResponse> updateFiliere(@PathVariable String id, @Valid @RequestBody CreateFiliereRequest request) {
        FiliereResponse filiere = filiereService.updateFiliere(id, request);
        return ResponseEntity.ok(filiere);
    }

    /**
     * PUT /api/schedules/filieres/classes/{id}
     * Met à jour une classe
     */
    @PutMapping("/classes/{id}")
    public ResponseEntity<com.iusjc.timora.schedule.dto.ClasseResponse> updateClasse(@PathVariable String id, @Valid @RequestBody CreateClasseRequest request) {
        com.iusjc.timora.schedule.dto.ClasseResponse classe = filiereService.updateClasse(id, request);
        return ResponseEntity.ok(classe);
    }

    /**
     * DELETE /api/schedules/filieres/classes/{id}
     * Supprime une classe
     */
    @DeleteMapping("/classes/{id}")
    public ResponseEntity<Void> deleteClasse(@PathVariable String id) {
        filiereService.deleteClasse(id);
        return ResponseEntity.noContent().build();
    }
}
