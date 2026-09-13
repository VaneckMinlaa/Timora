package com.iusjc.timora.schedule.controller;

import com.iusjc.timora.schedule.dto.CreateEcoleRequest;
import com.iusjc.timora.schedule.dto.EcoleResponse;
import com.iusjc.timora.schedule.service.EcoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des écoles
 */
@RestController
@RequestMapping("/api/schedules/ecoles")
@RequiredArgsConstructor
@Slf4j
public class EcoleController {

    private final EcoleService ecoleService;

    /**
     * GET /api/schedules/ecoles
     * Récupère toutes les écoles
     */
    @GetMapping
    public ResponseEntity<List<EcoleResponse>> getAllEcoles() {
        List<EcoleResponse> ecoles = ecoleService.getAllEcoles();
        return ResponseEntity.ok(ecoles);
    }

    /**
     * GET /api/schedules/ecoles/:id
     * Récupère une école par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<EcoleResponse> getEcoleById(@PathVariable String id) {
        EcoleResponse ecole = ecoleService.getEcoleById(id);
        return ResponseEntity.ok(ecole);
    }

    /**
     * POST /api/schedules/ecoles
     * Crée une nouvelle école
     */
    @PostMapping
    public ResponseEntity<EcoleResponse> createEcole(@Valid @RequestBody CreateEcoleRequest request) {
        EcoleResponse ecole = ecoleService.createEcole(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ecole);
    }

    /**
     * PUT /api/schedules/ecoles/:id
     * Met à jour une école
     */
    @PutMapping("/{id}")
    public ResponseEntity<EcoleResponse> updateEcole(
            @PathVariable String id,
            @Valid @RequestBody CreateEcoleRequest request) {
        EcoleResponse ecole = ecoleService.updateEcole(id, request);
        return ResponseEntity.ok(ecole);
    }

    /**
     * DELETE /api/schedules/ecoles/:id
     * Supprime une école
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEcole(@PathVariable String id) {
        ecoleService.deleteEcole(id);
        return ResponseEntity.noContent().build();
    }
}
