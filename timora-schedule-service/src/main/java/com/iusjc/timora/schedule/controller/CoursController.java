package com.iusjc.timora.schedule.controller;

import com.iusjc.timora.schedule.dto.CreateCoursRequest;
import com.iusjc.timora.schedule.dto.CoursResponse;
import com.iusjc.timora.schedule.dto.UpdateCoursRequest;
import com.iusjc.timora.schedule.service.CoursService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des cours
 */
@RestController
@RequestMapping("/api/schedules/cours")
@RequiredArgsConstructor
@Slf4j
public class CoursController {

    private final CoursService coursService;

    /**
     * POST /api/schedules/cours
     * Crée un nouveau cours avec assignation automatique de groupes
     */
    @PostMapping
    public ResponseEntity<CoursResponse> createCours(@Valid @RequestBody CreateCoursRequest request) {
        log.info("Requête de création de cours: {}", request.getNom());
        CoursResponse cours = coursService.createCours(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cours);
    }

    /**
     * GET /api/schedules/cours
     * Récupère tous les cours
     */
    @GetMapping
    public ResponseEntity<List<CoursResponse>> getAllCours() {
        List<CoursResponse> cours = coursService.getAllCours();
        return ResponseEntity.ok(cours);
    }

    /**
     * GET /api/schedules/cours/{id}
     * Récupère un cours par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CoursResponse> getCoursById(@PathVariable String id) {
        CoursResponse cours = coursService.getCoursById(id);
        return ResponseEntity.ok(cours);
    }

    /**
     * PUT /api/schedules/cours/{id}
     * Met à jour un cours
     */
    @PutMapping("/{id}")
    public ResponseEntity<CoursResponse> updateCours(
            @PathVariable String id,
            @Valid @RequestBody UpdateCoursRequest request) {
        CoursResponse cours = coursService.updateCours(id, request);
        return ResponseEntity.ok(cours);
    }

    /**
     * DELETE /api/schedules/cours/{id}
     * Supprime un cours
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCours(@PathVariable String id) {
        coursService.deleteCours(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/schedules/cours/enseignant/{enseignantId}
     * Récupère tous les cours d'un enseignant
     */
    @GetMapping("/enseignant/{enseignantId}")
    public ResponseEntity<List<CoursResponse>> getCoursByEnseignant(@PathVariable String enseignantId) {
        List<CoursResponse> cours = coursService.getCoursByEnseignant(enseignantId);
        return ResponseEntity.ok(cours);
    }

    /**
     * GET /api/schedules/cours/classe/{classeId}
     * Récupère tous les cours d'une classe
     */
    @GetMapping("/classe/{classeId}")
    public ResponseEntity<List<CoursResponse>> getCoursByClasse(@PathVariable String classeId) {
        List<CoursResponse> cours = coursService.getCoursByClasse(classeId);
        return ResponseEntity.ok(cours);
    }

    /**
     * DELETE /api/schedules/cours/deduplicate
     * Supprime les cours en double (même nom + enseignant + semestre)
     * Conserve le cours le plus récent
     */
    @DeleteMapping("/deduplicate")
    public ResponseEntity<java.util.Map<String, Object>> deduplicateCours() {
        log.info("Démarrage de la déduplication des cours");
        int removed = coursService.deduplicateCours();
        return ResponseEntity.ok(java.util.Map.of(
            "message", removed + " doublon(s) supprimé(s)",
            "removed", removed
        ));
    }
}
