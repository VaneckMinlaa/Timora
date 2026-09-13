package com.iusjc.timora.room.service;

import com.iusjc.timora.room.dto.CreateEquipementRequest;
import com.iusjc.timora.room.dto.EquipementResponse;
import com.iusjc.timora.room.dto.UpdateEquipementRequest;
import com.iusjc.timora.room.entity.Equipement;
import com.iusjc.timora.room.entity.EtatEquipement;
import com.iusjc.timora.room.entity.Salle;
import com.iusjc.timora.room.exception.ResourceNotFoundException;
import com.iusjc.timora.room.repository.EquipementRepository;
import com.iusjc.timora.room.repository.SalleRepository;
import com.iusjc.timora.room.util.ExcelHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des équipements
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EquipementService {

    private final EquipementRepository equipementRepository;
    private final SalleRepository salleRepository;

    /**
     * Créer un nouvel équipement
     */
    public EquipementResponse createEquipement(CreateEquipementRequest request) {
        log.info("Création d'un équipement: {}", request.getNom());
        
        String salleNom = "Non assigné";
        
        // Vérifier que la salle existe si elle est fournie
        if (request.getSalleId() != null && !request.getSalleId().isBlank()) {
            Salle salle = salleRepository.findById(request.getSalleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Salle non trouvée avec l'ID: " + request.getSalleId()));
            salleNom = salle.getNomsalle();
        }
        
        // Créer l'équipement
        Equipement equipement = Equipement.builder()
                .nom(request.getNom())
                .categorie(request.getCategorie())
                .statut(request.getStatut())
                .salleId(request.getSalleId())
                .build();
        
        Equipement savedEquipement = equipementRepository.save(equipement);
        log.info("Équipement créé avec succès: {}", savedEquipement.getIdEquip());
        
        return mapToResponse(savedEquipement, salleNom);
    }

    /**
     * Récupérer tous les équipements
     */
    public List<EquipementResponse> getAllEquipements() {
        log.info("Récupération de tous les équipements");
        List<Equipement> equipements = equipementRepository.findAll();
        return equipements.stream()
                .map(equipement -> {
                    String salleNom = getSalleNom(equipement.getSalleId());
                    return mapToResponse(equipement, salleNom);
                })
                .collect(Collectors.toList());
    }

    /**
     * Récupérer un équipement par son ID
     */
    public EquipementResponse getEquipementById(String id) {
        log.info("Récupération de l'équipement avec l'ID: {}", id);
        Equipement equipement = equipementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Équipement non trouvé avec l'ID: " + id));
        
        String salleNom = getSalleNom(equipement.getSalleId());
        
        return mapToResponse(equipement, salleNom);
    }

    /**
     * Mettre à jour un équipement
     */
    public EquipementResponse updateEquipement(String id, UpdateEquipementRequest request) {
        log.info("Mise à jour de l'équipement avec l'ID: {}", id);
        Equipement equipement = equipementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Équipement non trouvé avec l'ID: " + id));
        
        // Mettre à jour la salle si fournie (permet de vider avec une chaîne vide)
        if (request.getSalleId() != null && !request.getSalleId().equals(equipement.getSalleId())) {
            if (request.getSalleId().isBlank()) {
                equipement.setSalleId(null);
            } else {
                salleRepository.findById(request.getSalleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Salle non trouvée avec l'ID: " + request.getSalleId()));
                equipement.setSalleId(request.getSalleId());
            }
        }
        
        // Mettre à jour les champs
        if (request.getNom() != null && !request.getNom().trim().isEmpty()) {
            equipement.setNom(request.getNom().trim());
        }
        
        if (request.getCategorie() != null && !request.getCategorie().trim().isEmpty()) {
            equipement.setCategorie(request.getCategorie().trim());
        }
        
        if (request.getStatut() != null) {
            equipement.setStatut(request.getStatut());
        }
        
        Equipement updatedEquipement = equipementRepository.save(equipement);
        log.info("Équipement mis à jour avec succès: {}", updatedEquipement.getIdEquip());
        
        String salleNom = getSalleNom(updatedEquipement.getSalleId());
        
        return mapToResponse(updatedEquipement, salleNom);
    }

    /**
     * Supprimer un équipement
     */
    public void deleteEquipement(String id) {
        log.info("Suppression de l'équipement avec l'ID: {}", id);
        if (!equipementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Équipement non trouvé avec l'ID: " + id);
        }
        equipementRepository.deleteById(id);
        log.info("Équipement supprimé avec succès: {}", id);
    }

    /**
     * Récupérer tous les équipements d'une salle
     */
    @Transactional(readOnly = true)
    public List<EquipementResponse> getEquipementsBySalleId(String salleId) {
        log.info("Récupération des équipements de la salle: {}", salleId);
        
        // Vérifier que la salle existe
        Salle salle = salleRepository.findById(salleId)
                .orElseThrow(() -> new ResourceNotFoundException("Salle non trouvée avec l'ID: " + salleId));
        
        List<Equipement> equipements = equipementRepository.findBySalleId(salleId);
        String salleNom = salle.getNomsalle();
        
        return equipements.stream()
                .map(equipement -> mapToResponse(equipement, salleNom))
                .collect(Collectors.toList());
    }

    /**
     * Récupérer tous les équipements par statut
     */
    public List<EquipementResponse> getEquipementsByStatut(EtatEquipement statut) {
        log.info("Récupération des équipements avec le statut: {}", statut);
        List<Equipement> equipements = equipementRepository.findByStatut(statut);
        return equipements.stream()
                .map(equipement -> {
                    String salleNom = getSalleNom(equipement.getSalleId());
                    return mapToResponse(equipement, salleNom);
                })
                .collect(Collectors.toList());
    }

    public List<EquipementResponse> getAvailableEquipementsBySalleId(String salleId) {
        log.info("Récupération des équipements disponibles de la salle: {}", salleId);
        
        // Vérifier que la salle existe
        Salle salle = salleRepository.findById(salleId)
                .orElseThrow(() -> new ResourceNotFoundException("Salle non trouvée avec l'ID: " + salleId));
        
        List<Equipement> equipements = equipementRepository.findBySalleIdAndStatut(salleId, EtatEquipement.DISPONIBLE);
        String salleNom = salle.getNomsalle();
        
        return equipements.stream()
                .map(equipement -> mapToResponse(equipement, salleNom))
                .collect(Collectors.toList());
    }

    /**
     * Rechercher des équipements par nom
     */
    public List<EquipementResponse> searchEquipementsByNom(String nom) {
        log.info("Recherche d'équipements par nom: {}", nom);
        List<Equipement> equipements = equipementRepository.searchByNom(nom);
        return equipements.stream()
                .map(equipement -> {
                    String salleNom = getSalleNom(equipement.getSalleId());
                    return mapToResponse(equipement, salleNom);
                })
                .collect(Collectors.toList());
    }

    /**
     * Mapper un équipement vers un EquipementResponse
     */
    private EquipementResponse mapToResponse(Equipement equipement, String salleNom) {
        return EquipementResponse.builder()
                .idEquip(equipement.getIdEquip())
                .nom(equipement.getNom())
                .categorie(equipement.getCategorie())
                .statut(equipement.getStatut())
                .salleId(equipement.getSalleId())
                .salleNom(salleNom)
                .createdAt(equipement.getCreatedAt())
                .updatedAt(equipement.getUpdatedAt())
                .build();
    }

    /**
     * Helper pour récupérer le nom d'une salle en toute sécurité
     */
    private String getSalleNom(String salleId) {
        if (salleId == null || salleId.isBlank()) {
            return "Non assigné";
        }
        return salleRepository.findById(salleId)
                .map(Salle::getNomsalle)
                .orElse("Salle inconnue");
    }

    /**
     * Réserver un équipement (changer son statut à EN_COUR_D_UTILISATION)
     * Cette méthode peut être appelée lors de la création d'une réservation
     */
    public void reserverEquipement(String id) {
        log.info("Réservation de l'équipement avec l'ID: {}", id);
        Equipement equipement = equipementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Équipement non trouvé avec l'ID: " + id));
        
        if (equipement.getStatut() != EtatEquipement.DISPONIBLE) {
            throw new IllegalArgumentException("L'équipement n'est pas disponible pour réservation. Statut actuel: " + equipement.getStatut());
        }
        
        equipement.setStatut(EtatEquipement.EN_COUR_D_UTILISATION);
        equipementRepository.save(equipement);
        log.info("Équipement réservé avec succès: {}", id);
    }

    /**
     * Libérer un équipement (changer son statut à DISPONIBLE)
     * Cette méthode peut être appelée lors de l'annulation ou de la fin d'une réservation
     */
    public void libererEquipement(String id) {
        log.info("Libération de l'équipement avec l'ID: {}", id);
        Equipement equipement = equipementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Équipement non trouvé avec l'ID: " + id));
        
        if (equipement.getStatut() == EtatEquipement.EN_COUR_D_UTILISATION) {
            equipement.setStatut(EtatEquipement.DISPONIBLE);
            equipementRepository.save(equipement);
            log.info("Équipement libéré avec succès: {}", id);
        } else {
            log.warn("L'équipement {} n'était pas en cours d'utilisation. Statut actuel: {}", id, equipement.getStatut());
        }
    }

    /**
     * Importer des équipements depuis un fichier Excel.
     * Colonnes: nom | categorie | statut | salleId
     */
    public List<EquipementResponse> importFromExcel(MultipartFile file) {
        if (!ExcelHelper.hasExcelFormat(file)) {
            throw new IllegalArgumentException("Le fichier doit être au format Excel (.xlsx)");
        }
        try {
            List<Equipement> list = ExcelHelper.excelToEquipements(file.getInputStream());
            List<EquipementResponse> results = new ArrayList<>();
            for (Equipement e : list) {
                if (e.getNom() == null || e.getNom().isBlank()) continue;
                String salleNom = "Salle inconnue";
                if (e.getSalleId() != null && !e.getSalleId().isBlank()) {
                    var salleOpt = salleRepository.findByNomsalleIgnoreCase(e.getSalleId().trim());
                    if (salleOpt.isEmpty()) {
                        log.warn("Salle introuvable avec le nom '{}' pour l'équipement '{}', ignoré", e.getSalleId(), e.getNom());
                        continue;
                    }
                    salleNom = salleOpt.get().getNomsalle();
                    e.setSalleId(salleOpt.get().getIdSalle()); // Replace the name with the actual ID
                }
                Equipement saved = equipementRepository.save(e);
                results.add(mapToResponse(saved, salleNom));
            }
            log.info("{} équipement(s) importé(s) depuis Excel", results.size());
            return results;
        } catch (IOException ex) {
            throw new RuntimeException("Erreur lecture fichier: " + ex.getMessage());
        }
    }
}

