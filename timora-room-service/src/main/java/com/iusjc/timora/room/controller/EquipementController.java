package com.iusjc.timora.room.controller;

import com.iusjc.timora.room.dto.CreateEquipementRequest;
import com.iusjc.timora.room.dto.EquipementResponse;
import com.iusjc.timora.room.dto.UpdateEquipementRequest;
import com.iusjc.timora.room.entity.EtatEquipement;
import com.iusjc.timora.room.service.EquipementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Controller REST pour la gestion des équipements
 * Port backend: 8083 (Room Service)
 */
@RestController
@RequestMapping("/api/equipements")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EquipementController {

    private final EquipementService equipementService;

    @PostMapping
    public ResponseEntity<EquipementResponse> createEquipement(@Valid @RequestBody CreateEquipementRequest request) {
        log.info("POST /api/equipements - Création d'un équipement: {}", request.getNom());
        EquipementResponse response = equipementService.createEquipement(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<EquipementResponse>> getAllEquipements() {
        log.info("GET /api/equipements - Récupération de tous les équipements");
        List<EquipementResponse> equipements = equipementService.getAllEquipements();
        return ResponseEntity.ok(equipements);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipementResponse> getEquipementById(@PathVariable String id) {
        log.info("GET /api/equipements/{} - Récupération d'un équipement", id);
        EquipementResponse response = equipementService.getEquipementById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipementResponse> updateEquipement(
            @PathVariable String id,
            @Valid @RequestBody UpdateEquipementRequest request) {
        log.info("PUT /api/equipements/{} - Mise à jour d'un équipement", id);
        EquipementResponse response = equipementService.updateEquipement(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquipement(@PathVariable String id) {
        log.info("DELETE /api/equipements/{} - Suppression d'un équipement", id);
        equipementService.deleteEquipement(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/salle/{salleId}")
    public ResponseEntity<List<EquipementResponse>> getEquipementsBySalleId(@PathVariable String salleId) {
        log.info("GET /api/equipements/salle/{} - Récupération des équipements d'une salle", salleId);
        List<EquipementResponse> equipements = equipementService.getEquipementsBySalleId(salleId);
        return ResponseEntity.ok(equipements);
    }

    @GetMapping("/salle/{salleId}/disponibles")
    public ResponseEntity<List<EquipementResponse>> getAvailableEquipementsBySalleId(@PathVariable String salleId) {
        log.info("GET /api/equipements/salle/{}/disponibles - Récupération des équipements disponibles", salleId);
        List<EquipementResponse> equipements = equipementService.getAvailableEquipementsBySalleId(salleId);
        return ResponseEntity.ok(equipements);
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<EquipementResponse>> getEquipementsByStatut(@PathVariable EtatEquipement statut) {
        log.info("GET /api/equipements/statut/{} - Récupération des équipements par statut", statut);
        List<EquipementResponse> equipements = equipementService.getEquipementsByStatut(statut);
        return ResponseEntity.ok(equipements);
    }

    @GetMapping("/search")
    public ResponseEntity<List<EquipementResponse>> searchEquipementsByNom(@RequestParam String nom) {
        log.info("GET /api/equipements/search?nom={} - Recherche d'équipements", nom);
        List<EquipementResponse> equipements = equipementService.searchEquipementsByNom(nom);
        return ResponseEntity.ok(equipements);
    }

    @PatchMapping("/{id}/reserver")
    public ResponseEntity<Void> reserverEquipement(@PathVariable String id) {
        log.info("PATCH /api/equipements/{}/reserver - Réservation d'un équipement", id);
        equipementService.reserverEquipement(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/liberer")
    public ResponseEntity<Void> libererEquipement(@PathVariable String id) {
        log.info("PATCH /api/equipements/{}/liberer - Libération d'un équipement", id);
        equipementService.libererEquipement(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> importEquipements(@RequestParam("file") MultipartFile file) {
        log.info("POST /api/equipements/import - Import depuis Excel");
        List<EquipementResponse> imported = equipementService.importFromExcel(file);
        return ResponseEntity.ok(Map.of(
                "message", imported.size() + " équipement(s) importé(s) avec succès",
                "count", imported.size(),
                "data", imported
        ));
    }
}
