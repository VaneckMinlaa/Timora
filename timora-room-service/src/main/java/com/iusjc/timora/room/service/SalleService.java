package com.iusjc.timora.room.service;

import com.iusjc.timora.room.entity.Salle;
import com.iusjc.timora.room.entity.TypeSalle;
import com.iusjc.timora.room.exception.ResourceNotFoundException;
import com.iusjc.timora.room.repository.SalleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Service pour la gestion des salles
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SalleService {

    private final SalleRepository salleRepository;

    /**
     * Récupérer toutes les salles
     * GET /api/rooms
     */
    public List<Salle> getAllSalles() {
        log.info("Récupération de toutes les salles");
        return salleRepository.findAll();
    }

    /**
     * Récupérer une salle par ID
     * GET /api/rooms/:id
     */
    public Salle getSalleById(String id) {
        log.info("Récupération de la salle: {}", id);
        return salleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salle non trouvée avec l'ID: " + id));
    }

    /**
     * Créer une salle
     * POST /api/rooms
     */
    public Salle createSalle(Salle salle) {
        log.info("Création d'une salle: {}", salle.getNomsalle());
        
        // Valider les données
        validateSalle(salle);
        
        Salle saved = salleRepository.save(salle);
        log.info("Salle créée avec succès: {}", saved.getIdSalle());
        return saved;
    }

    /**
     * Mettre à jour une salle
     * PUT /api/rooms/:id
     */
    public Salle updateSalle(String id, Salle salle) {
        log.info("Mise à jour de la salle: {}", id);
        Salle existing = salleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salle non trouvée avec l'ID: " + id));

        // Mettre à jour les champs
        if (salle.getNomsalle() != null) existing.setNomsalle(salle.getNomsalle());
        if (salle.getCapacite() != null) existing.setCapacite(salle.getCapacite());
        if (salle.getTypeSalle() != null) existing.setTypeSalle(salle.getTypeSalle());
        if (salle.getEcole() != null) existing.setEcole(salle.getEcole());

        Salle updated = salleRepository.save(existing);
        log.info("Salle mise à jour: {}", updated.getIdSalle());
        return updated;
    }

    /**
     * Supprimer une salle
     * DELETE /api/rooms/:id
     */
    public void deleteSalle(String id) {
        log.info("Suppression de la salle: {}", id);
        if (!salleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Salle non trouvée avec l'ID: " + id);
        }
        salleRepository.deleteById(id);
        log.info("Salle supprimée: {}", id);
    }

    /**
     * Rechercher des salles par nom
     * GET /api/rooms/search?query=xxx
     */
    public List<Salle> searchSalles(String query) {
        log.info("Recherche de salles avec la requête: {}", query);
        return salleRepository.searchByNom(query);
    }

    /**
     * Récupérer les salles par type
     */
    public List<Salle> getSallesByType(TypeSalle typeSalle) {
        log.info("Récupération des salles de type: {}", typeSalle);
        return salleRepository.findByTypeSalle(typeSalle);
    }

    /**
     * Récupérer les salles par capacité minimale
     */
    public List<Salle> getSallesByMinCapacity(Integer capaciteMin) {
        log.info("Récupération des salles avec capacité >= {}", capaciteMin);
        return salleRepository.findByCapaciteGreaterThanEqual(capaciteMin);
    }

    /**
     * Récupérer les salles disponibles selon des critères
     * GET /api/rooms/available?startDate=xxx&endDate=xxx&capacity=xxx&type=xxx
     * Note: La disponibilité réelle doit être vérifiée via le service de réservation
     */
    public List<Salle> getAvailableSalles(TypeSalle typeSalle, Integer capaciteMin) {
        log.info("Récupération des salles disponibles (type: {}, capacité min: {})", typeSalle, capaciteMin);
        
        if (typeSalle != null && capaciteMin != null) {
            return salleRepository.findAvailableRoomsByCriteria(typeSalle, capaciteMin);
        } else if (typeSalle != null) {
            return salleRepository.findByTypeSalle(typeSalle);
        } else if (capaciteMin != null) {
            return salleRepository.findByCapaciteGreaterThanEqual(capaciteMin);
        } else {
            return salleRepository.findAll();
        }
    }

    /**
     * Vérifier si une salle existe
     */
    public boolean existsSalle(String id) {
        return salleRepository.existsById(id);
    }

    /**
     * Importer des salles depuis un fichier Excel.
     * Colonnes: nom | capacite | typeSalle
     */
    public List<Salle> importFromExcel(org.springframework.web.multipart.MultipartFile file) {
        if (!com.iusjc.timora.room.util.ExcelHelper.hasExcelFormat(file)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Le fichier doit être au format Excel (.xlsx)"
            );
        }
        try {
            java.util.List<Salle> list = com.iusjc.timora.room.util.ExcelHelper.excelToSalles(file.getInputStream());
            java.util.List<Salle> saved = new java.util.ArrayList<>();
            for (Salle s : list) {
                if (s.getNomsalle() == null || s.getNomsalle().isBlank()) continue;
                saved.add(salleRepository.save(s));
            }
            log.info("{} salle(s) importée(s) depuis Excel", saved.size());
            return saved;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lecture fichier: " + e.getMessage());
        }
    }

    /**
     * Valider les données d'une salle
     */
    private void validateSalle(Salle salle) {
        if (salle.getNomsalle() == null || salle.getNomsalle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom de la salle est obligatoire");
        }
        if (salle.getTypeSalle() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le type de salle est obligatoire");
        }
        if (salle.getCapacite() != null && salle.getCapacite() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La capacité ne peut pas être négative");
        }
    }
}
