package com.iusjc.timora.user.controller;

import com.iusjc.timora.user.dto.CreateEtudiantRequest;
import com.iusjc.timora.user.dto.EtudiantResponse;
import com.iusjc.timora.user.service.EtudiantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la gestion des étudiants
 */
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@Tag(name = "Etudiant Management", description = "Endpoints pour la gestion des étudiants")
public class EtudiantController {

    private final EtudiantService etudiantService;

    @GetMapping
    @Operation(summary = "Récupérer tous les étudiants")
    public ResponseEntity<List<EtudiantResponse>> getAllEtudiants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filiereId,
            @RequestParam(required = false) String classeId) {
        return ResponseEntity.ok(etudiantService.getAllEtudiants(search, filiereId, classeId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un étudiant par ID")
    public ResponseEntity<EtudiantResponse> getEtudiantById(@PathVariable String id) {
        return ResponseEntity.ok(etudiantService.getEtudiantById(id));
    }

    @PostMapping
    @Operation(summary = "Créer un nouvel étudiant")
    public ResponseEntity<EtudiantResponse> createEtudiant(@Valid @RequestBody CreateEtudiantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(etudiantService.createEtudiant(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un étudiant")
    public ResponseEntity<EtudiantResponse> updateEtudiant(
            @PathVariable String id,
            @Valid @RequestBody CreateEtudiantRequest request) {
        return ResponseEntity.ok(etudiantService.updateEtudiant(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un étudiant")
    public ResponseEntity<Void> deleteEtudiant(@PathVariable String id) {
        etudiantService.deleteEtudiant(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importer des étudiants depuis un fichier Excel (.xlsx)",
               description = "Colonnes: nom | prénom | email | téléphone | filiereId | niveau | ecoleId | classeId")
    public ResponseEntity<Map<String, Object>> importEtudiants(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "filieresMap", required = false) String filieresMap,
            @RequestParam(value = "classesMap", required = false) String classesMap,
            @RequestParam(value = "ecolesMap", required = false) String ecolesMap) {
        List<EtudiantResponse> imported = etudiantService.importFromExcel(file, filieresMap, classesMap, ecolesMap);
        return ResponseEntity.ok(Map.of(
                "message", imported.size() + " étudiant(s) importé(s) avec succès",
                "count", imported.size(),
                "data", imported
        ));
    }
}
