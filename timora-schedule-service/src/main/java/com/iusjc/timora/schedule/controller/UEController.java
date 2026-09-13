package com.iusjc.timora.schedule.controller;

import com.iusjc.timora.schedule.dto.CreateUERequest;
import com.iusjc.timora.schedule.dto.UEResponse;
import com.iusjc.timora.schedule.service.UEService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des UEs
 */
@RestController
@RequestMapping("/api/schedules/ues")
@RequiredArgsConstructor
@Slf4j
public class UEController {

    private final UEService ueService;

    /**
     * GET /api/schedules/ues
     * Récupère toutes les UEs
     */
    @GetMapping
    public ResponseEntity<List<UEResponse>> getAllUEs() {
        List<UEResponse> ues = ueService.getAllUEs();
        return ResponseEntity.ok(ues);
    }

    /**
     * GET /api/schedules/ues/{id}
     * Récupère une UE par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UEResponse> getUEById(@PathVariable String id) {
        UEResponse ue = ueService.getUEById(id);
        return ResponseEntity.ok(ue);
    }

    /**
     * GET /api/schedules/ues/code/{codeUE}
     * Récupère une UE par code
     */
    @GetMapping("/code/{codeUE}")
    public ResponseEntity<UEResponse> getUEByCode(@PathVariable String codeUE) {
        UEResponse ue = ueService.getUEByCode(codeUE);
        return ResponseEntity.ok(ue);
    }

    /**
     * POST /api/schedules/ues
     * Crée une nouvelle UE
     */
    @PostMapping
    public ResponseEntity<UEResponse> createUE(@Valid @RequestBody CreateUERequest request) {
        UEResponse ue = ueService.createUE(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ue);
    }

    /**
     * DELETE /api/schedules/ues/{id}
     * Supprime une UE
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUE(@PathVariable String id) {
        ueService.deleteUE(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/schedules/ues/{id}
     * Met à jour une UE
     */
    @PutMapping("/{id}")
    public ResponseEntity<UEResponse> updateUE(@PathVariable String id, @Valid @RequestBody CreateUERequest request) {
        UEResponse ue = ueService.updateUE(id, request);
        return ResponseEntity.ok(ue);
    }
}
