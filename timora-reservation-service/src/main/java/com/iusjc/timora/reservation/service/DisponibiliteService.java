package com.iusjc.timora.reservation.service;

import com.iusjc.timora.reservation.dto.CreateDisponibiliteRequest;
import com.iusjc.timora.reservation.dto.DisponibiliteResponse;
import com.iusjc.timora.reservation.dto.UpdateDisponibiliteRequest;
import com.iusjc.timora.reservation.entity.Disponibilite;
import com.iusjc.timora.reservation.repository.DisponibiliteRepository;
import com.iusjc.timora.reservation.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des disponibilités
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DisponibiliteService {

    private final DisponibiliteRepository disponibiliteRepository;

    /**
     * Créer une disponibilité
     * Méthode selon UML : +creerDispo(jour: DateTime, heureDebut: DateTime, heureFin: DateTime)
     * POST /api/reservations/disponibilites
     */
    public DisponibiliteResponse createDisponibilite(CreateDisponibiliteRequest request) {
        log.info("Création d'une disponibilité pour l'utilisateur: {}", request.getUtilisateurId());

        // Empêcher la création de disponibilités dans le passé
        if (request.getDate() != null && request.getDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Impossible de créer une disponibilité à une date déjà passée");
        }

        // Valider que l'heure de fin est supérieure à l'heure de début
        if (request.getHeureFin().isBefore(request.getHeureDebut()) ||
            request.getHeureFin().equals(request.getHeureDebut())) {
            throw new IllegalArgumentException("L'heure de fin doit être supérieure à l'heure de début");
        }

        // Valider les restrictions horaires (8h-17h)
        LocalTime heureMin = LocalTime.of(8, 0);
        LocalTime heureMax = LocalTime.of(17, 0);
        LocalTime pauseDebut = LocalTime.of(12, 0);
        LocalTime pauseFin = LocalTime.of(13, 0);

        // Vérifier que l'heure de début est au minimum 8h
        if (request.getHeureDebut().isBefore(heureMin)) {
            throw new IllegalArgumentException("L'heure de début doit être au minimum 8h");
        }

        // Vérifier que l'heure de fin est au maximum 17h
        if (request.getHeureFin().isAfter(heureMax)) {
            throw new IllegalArgumentException("L'heure de fin doit être au maximum 17h");
        }

        // Vérifier que le créneau ne chevauche pas la pause de midi (12h-13h)
        if ((request.getHeureDebut().isBefore(pauseFin) && request.getHeureFin().isAfter(pauseDebut))) {
            throw new IllegalArgumentException("Les disponibilités ne peuvent pas être créées pendant la pause de midi (12h-13h)");
        }

        // Vérifier les chevauchements (par date et créneau horaire)
        List<Disponibilite> overlapping = disponibiliteRepository.findOverlappingDisponibilitesByDate(
                request.getUtilisateurId(),
                request.getDate(),
                request.getHeureDebut(),
                request.getHeureFin()
        );

        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException(
                    "Une disponibilité existe déjà pour ce créneau horaire le " + request.getJour()
            );
        }

        // Créer la disponibilité
        Disponibilite disponibilite = Disponibilite.builder()
                .jour(request.getJour())
                .date(request.getDate())
                .heureDebut(request.getHeureDebut())
                .heureFin(request.getHeureFin())
                .utilisateurId(request.getUtilisateurId())
                .emploiDuTempsId(request.getEmploiDuTempsId())
                .build();

        Disponibilite saved = disponibiliteRepository.save(disponibilite);
        log.info("Disponibilité créée avec succès: {}", saved.getIdDisponibilite());

        return mapToResponse(saved);
    }

    /**
     * Récupérer toutes les disponibilités d'un utilisateur
     * GET /api/reservations/disponibilites/user/:userId
     */
    @Transactional(readOnly = true)
    public List<DisponibiliteResponse> getDisponibilitesByUserId(String userId) {
        log.info("Récupération des disponibilités pour l'utilisateur: {}", userId);
        return disponibiliteRepository.findByUtilisateurId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer une disponibilité par ID
     * GET /api/reservations/disponibilites/:id
     */
    @Transactional(readOnly = true)
    public DisponibiliteResponse getDisponibiliteById(String id) {
        log.info("Récupération de la disponibilité: {}", id);
        
        // Vérifier si c'est un ID mocké (créé côté frontend pour le drag and drop)
        if (id != null && !id.isEmpty() && id.startsWith("mock-")) {
            log.warn("Tentative de récupération d'une disponibilité mockée (ID: {}). Les disponibilités mockées n'existent pas dans la base de données.", id);
            throw new ResourceNotFoundException("Disponibilité non trouvée avec l'ID: " + id + " (disponibilité temporaire non sauvegardée)");
        }
        
        Disponibilite disponibilite = disponibiliteRepository.findByIdDisponibilite(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disponibilité non trouvée avec l'ID: " + id));
        return mapToResponse(disponibilite);
    }

    /**
     * Mettre à jour une disponibilité
     * PUT /api/reservations/disponibilites/:id
     */
    public DisponibiliteResponse updateDisponibilite(String id, UpdateDisponibiliteRequest request) {
        log.info("Mise à jour de la disponibilité: {}", id);

        // Vérifier si c'est un ID mocké (créé côté frontend pour le drag and drop)
        if (id != null && !id.isEmpty() && id.startsWith("mock-")) {
            log.warn("Tentative de mise à jour d'une disponibilité mockée (ID: {}). Les disponibilités mockées doivent être créées via POST avant d'être mises à jour.", id);
            throw new IllegalArgumentException("Impossible de mettre à jour une disponibilité temporaire. Veuillez d'abord créer la disponibilité.");
        }

        Disponibilite disponibilite = disponibiliteRepository.findByIdDisponibilite(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disponibilité non trouvée avec l'ID: " + id));

        // Mettre à jour les champs si fournis
        if (request.getJour() != null) {
            disponibilite.setJour(request.getJour());
        }
        if (request.getHeureDebut() != null) {
            disponibilite.setHeureDebut(request.getHeureDebut());
        }
        if (request.getHeureFin() != null) {
            disponibilite.setHeureFin(request.getHeureFin());
        }
        if (request.getEmploiDuTempsId() != null) {
            disponibilite.setEmploiDuTempsId(request.getEmploiDuTempsId());
        }

        // Valider que l'heure de fin est supérieure à l'heure de début
        if (disponibilite.getHeureFin().isBefore(disponibilite.getHeureDebut()) ||
            disponibilite.getHeureFin().equals(disponibilite.getHeureDebut())) {
            throw new IllegalArgumentException("L'heure de fin doit être supérieure à l'heure de début");
        }

        // Valider les restrictions horaires (8h-17h)
        LocalTime heureMin = LocalTime.of(8, 0);
        LocalTime heureMax = LocalTime.of(17, 0);
        LocalTime pauseDebut = LocalTime.of(12, 0);
        LocalTime pauseFin = LocalTime.of(13, 0);

        // Vérifier que l'heure de début est au minimum 8h
        if (disponibilite.getHeureDebut().isBefore(heureMin)) {
            throw new IllegalArgumentException("L'heure de début doit être au minimum 8h");
        }

        // Vérifier que l'heure de fin est au maximum 17h
        if (disponibilite.getHeureFin().isAfter(heureMax)) {
            throw new IllegalArgumentException("L'heure de fin doit être au maximum 17h");
        }

        // Vérifier que le créneau ne chevauche pas la pause de midi (12h-13h)
        if ((disponibilite.getHeureDebut().isBefore(pauseFin) && disponibilite.getHeureFin().isAfter(pauseDebut))) {
            throw new IllegalArgumentException("Les disponibilités ne peuvent pas être créées pendant la pause de midi (12h-13h)");
        }

        // Vérifier les chevauchements (exclure la disponibilité actuelle)
        List<Disponibilite> overlapping = disponibiliteRepository.findOverlappingDisponibilites(
                disponibilite.getUtilisateurId(),
                disponibilite.getJour(),
                disponibilite.getHeureDebut(),
                disponibilite.getHeureFin()
        );

        overlapping.removeIf(d -> id.equals(d.getIdDisponibilite()));
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException(
                    "Une disponibilité existe déjà pour ce créneau horaire le " + disponibilite.getJour()
            );
        }

        Disponibilite updated = disponibiliteRepository.save(disponibilite);
        log.info("Disponibilité mise à jour avec succès: {}", updated.getIdDisponibilite());

        return mapToResponse(updated);
    }

    /**
     * Supprimer une disponibilité
     * DELETE /api/reservations/disponibilites/:id
     */
    public void deleteDisponibilite(String id) {
        log.info("Suppression de la disponibilité: {}", id);
        if (!disponibiliteRepository.existsByIdDisponibilite(id)) {
            throw new ResourceNotFoundException("Disponibilité non trouvée avec l'ID: " + id);
        }
        disponibiliteRepository.deleteById(id);
        log.info("Disponibilité supprimée avec succès: {}", id);
    }

    /**
     * Récupérer les disponibilités par jour
     * GET /api/reservations/disponibilites/day/:jour
     */
    @Transactional(readOnly = true)
    public List<DisponibiliteResponse> getDisponibilitesByDay(String jour, String userId) {
        log.info("Récupération des disponibilités pour le jour: {} et utilisateur: {}", jour, userId);
        List<Disponibilite> disponibilites;
        if (userId != null && !userId.isEmpty()) {
            disponibilites = disponibiliteRepository.findByJourAndUtilisateurId(jour, userId);
        } else {
            disponibilites = disponibiliteRepository.findByJour(jour);
        }
        return disponibilites.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les disponibilités par EmploiDuTemps
     * GET /api/reservations/disponibilites/emploi-du-temps/:edtId
     */
    @Transactional(readOnly = true)
    public List<DisponibiliteResponse> getDisponibilitesByEmploiDuTempsId(String edtId) {
        log.info("Récupération des disponibilités pour l'emploi du temps: {}", edtId);
        return disponibiliteRepository.findByEmploiDuTempsId(edtId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les disponibilités par utilisateur et plage de dates
     * GET /api/reservations/disponibilites/user/:userId/range?startDate=xxx&endDate=xxx
     */
    @Transactional(readOnly = true)
    public List<DisponibiliteResponse> getDisponibilitesByUserIdAndDateRange(
            String userId, LocalDate startDate, LocalDate endDate) {
        log.info("Récupération des disponibilités pour l'utilisateur {} entre {} et {}", 
                userId, startDate, endDate);
        return disponibiliteRepository.findByUtilisateurIdAndDateBetween(userId, startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer toutes les disponibilités par plage de dates (pour admin)
     * GET /api/reservations/disponibilites/all/range?startDate=xxx&endDate=xxx
     */
    @Transactional(readOnly = true)
    public List<DisponibiliteResponse> getAllDisponibilitesByDateRange(
            LocalDate startDate, LocalDate endDate) {
        log.info("Récupération de toutes les disponibilités entre {} et {}", startDate, endDate);
        return disponibiliteRepository.findByDateBetween(startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Mapper l'entité vers le DTO de réponse
     */
    private DisponibiliteResponse mapToResponse(Disponibilite disponibilite) {
        return DisponibiliteResponse.builder()
                .idDisponibilite(disponibilite.getIdDisponibilite())
                .jour(disponibilite.getJour())
                .date(disponibilite.getDate())
                .heureDebut(disponibilite.getHeureDebut())
                .heureFin(disponibilite.getHeureFin())
                .utilisateurId(disponibilite.getUtilisateurId())
                .emploiDuTempsId(disponibilite.getEmploiDuTempsId())
                .createdAt(disponibilite.getCreatedAt())
                .updatedAt(disponibilite.getUpdatedAt())
                .build();
    }
}

