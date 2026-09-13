package com.iusjc.timora.schedule.controller;

import com.iusjc.timora.schedule.dto.*;
import com.iusjc.timora.schedule.entity.ConflictStatus;
import com.iusjc.timora.schedule.entity.ConflictType;
import com.iusjc.timora.schedule.service.ConflictService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la gestion des conflits d'horaires
 */
@RestController
@RequestMapping("/api/conflicts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Conflicts", description = "API de gestion des conflits d'horaires")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8080"})
public class ConflictController {

    private final ConflictService conflictService;

    @GetMapping
    @Operation(summary = "Récupérer tous les conflits", description = "Récupère la liste de tous les conflits avec filtres optionnels")
    public ResponseEntity<List<ConflictResponse>> getAllConflicts(
            @RequestParam(required = false) ConflictStatus status,
            @RequestParam(required = false) ConflictType type
    ) {
        log.info("GET /api/conflicts - status: {}, type: {}", status, type);
        List<ConflictResponse> conflicts = conflictService.getAllConflicts(status, type);
        return ResponseEntity.ok(conflicts);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer les détails d'un conflit", description = "Récupère les détails complets d'un conflit avec les solutions proposées")
    public ResponseEntity<ConflictDetailsResponse> getConflictDetails(@PathVariable String id) {
        log.info("GET /api/conflicts/{}", id);
        ConflictDetailsResponse details = conflictService.getConflictDetails(id);
        return ResponseEntity.ok(details);
    }

    @PostMapping("/detect")
    @Operation(summary = "Détecter les conflits", description = "Lance la détection de tous les conflits dans les emplois du temps")
    public ResponseEntity<List<ConflictResponse>> detectConflicts() {
        log.info("POST /api/conflicts/detect");
        List<ConflictResponse> conflicts = conflictService.detectConflicts();
        return ResponseEntity.ok(conflicts);
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Résoudre un conflit", description = "Applique une solution pour résoudre un conflit")
    public ResponseEntity<Void> resolveConflict(
            @PathVariable String id,
            @RequestBody ResolveConflictRequest request
    ) {
        log.info("POST /api/conflicts/{}/resolve", id);
        conflictService.resolveConflict(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ignore")
    @Operation(summary = "Ignorer un conflit", description = "Marque un conflit comme ignoré")
    public ResponseEntity<Void> ignoreConflict(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        log.info("POST /api/conflicts/{}/ignore", id);
        String reason = body != null ? body.get("reason") : "Aucune raison fournie";
        conflictService.ignoreConflict(id, reason);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/auto-resolve-all")
    @Operation(summary = "Résoudre automatiquement tous les conflits", description = "Applique automatiquement la meilleure solution pour chaque conflit en attente")
    public ResponseEntity<Map<String, Integer>> autoResolveAllConflicts() {
        log.info("POST /api/conflicts/auto-resolve-all");
        Map<String, Integer> result = conflictService.autoResolveAllConflicts();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    @Operation(summary = "Récupérer les statistiques des conflits", description = "Récupère les statistiques globales sur les conflits")
    public ResponseEntity<ConflictStatsResponse> getConflictStats() {
        log.info("GET /api/conflicts/stats");
        ConflictStatsResponse stats = conflictService.getConflictStats();
        return ResponseEntity.ok(stats);
    }
}
