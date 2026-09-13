package com.iusjc.timora.reservation.service;

import com.iusjc.timora.reservation.client.RoomServiceClient;
import com.iusjc.timora.reservation.dto.CreateReservationRequest;
import com.iusjc.timora.reservation.dto.ReservationResponse;
import com.iusjc.timora.reservation.dto.UpdateReservationRequest;
import com.iusjc.timora.reservation.entity.DemandeDeReservation;
import com.iusjc.timora.reservation.entity.StatutReservation;
import com.iusjc.timora.reservation.exception.ResourceNotFoundException;
import com.iusjc.timora.reservation.repository.DemandeDeReservationRepository;
import com.iusjc.timora.reservation.service.RoomAssignmentService;
import com.iusjc.timora.reservation.service.RealTimeAvailabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des réservations (DemandeDeReservation)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReservationService {

    private final DemandeDeReservationRepository reservationRepository;
    private final RoomServiceClient roomServiceClient;
    private final RoomAssignmentService roomAssignmentService;
    private final RealTimeAvailabilityService realTimeAvailabilityService;

    /**
     * Créer une demande de réservation
     * POST /api/reservations
     * 
     * Si salleId n'est pas fourni, une assignation automatique est effectuée
     * basée sur typeCours et numberOfParticipants
     */
    public ReservationResponse createReservation(CreateReservationRequest request) {
        log.info("Création d'une réservation pour l'utilisateur {}", request.getUtilisateurId());

        // Valider les données de la requête
        validateReservationRequest(request);

        String salleId = request.getSalleId();
        
        // Si salleId n'est pas fourni, effectuer une assignation automatique
        if (salleId == null || salleId.trim().isEmpty()) {
            log.info("Aucune salle spécifiée, assignation automatique en cours...");
            
            // Vérifier que les informations nécessaires sont fournies
            if (request.getTypeCours() == null || request.getTypeCours().trim().isEmpty()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pour une assignation automatique, le type de cours (typeCours) est obligatoire"
                );
            }
            
            if (request.getNumberOfParticipants() == null || request.getNumberOfParticipants() <= 0) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pour une assignation automatique, le nombre de participants (numberOfParticipants) est obligatoire"
                );
            }
            
            // Assigner automatiquement une salle
            salleId = roomAssignmentService.autoAssignRoom(
                    request.getTypeCours(),
                    request.getNumberOfParticipants(),
                    request.getDate(),
                    request.getHeureDebut(),
                    request.getHeureFin()
            );
            
            if (salleId == null) {
                throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Aucune salle disponible pour les critères suivants: typeCours=" + 
                    request.getTypeCours() + ", numberOfParticipants=" + request.getNumberOfParticipants()
                );
            }
            
            log.info("Salle automatiquement assignée: {}", salleId);
        }

        // Vérifier que la salle existe (appel au Room Service)
        Map<String, Object> room;
        try {
            room = roomServiceClient.getRoomById(salleId);
            if (room == null || room.isEmpty()) {
                log.warn("La salle {} n'a pas pu être récupérée du Room Service (réponse vide ou fallback activé)", salleId);
                throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, 
                    "La salle avec l'ID " + salleId + " n'existe pas"
                );
            }
            log.info("Salle récupérée avec succès: {}", room.get("idSalle") != null ? room.get("idSalle") : room.get("id"));
        } catch (ResponseStatusException e) {
            // Si c'est déjà une ResponseStatusException (404), la relancer
            log.error("Erreur lors de la récupération de la salle {}: {}", salleId, e.getReason());
            throw e;
        } catch (Exception e) {
            // Pour les autres exceptions (timeout, communication, etc.)
            log.error("Erreur de communication avec le Room Service pour la salle {}: {}", salleId, e.getMessage(), e);
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE, 
                "Le service de gestion des salles est temporairement indisponible. Veuillez réessayer plus tard."
            );
        }

        // Vérifier les conflits de réservation
        List<DemandeDeReservation> conflicts = reservationRepository.findConflictingReservations(
            salleId,
            request.getDate(),
            request.getHeureDebut(),
            request.getHeureFin(),
            StatutReservation.ANNULEE
        );

        if (!conflicts.isEmpty()) {
            log.warn("Conflit de réservation détecté pour la salle {} à la date {} entre {} et {}", 
                     salleId, request.getDate(), 
                     request.getHeureDebut(), request.getHeureFin());
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Un conflit de réservation existe déjà pour cette salle à cette date et heure"
            );
        }

        // Vérifier que la date n'est pas dans le passé
        if (request.getDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Impossible de créer une réservation à une date déjà passée"
            );
        }

        // Créer la réservation
        DemandeDeReservation reservation = DemandeDeReservation.builder()
            .salleId(salleId) // Utiliser la salle assignée (automatique ou manuelle)
            .utilisateurId(request.getUtilisateurId())
            .date(request.getDate())
            .heuredebut(request.getHeureDebut())
            .heureFin(request.getHeureFin())
            .coursId(request.getCoursId())
            .evenementId(request.getEvenementId())
            .purpose(request.getPurpose())
            .numberOfParticipants(request.getNumberOfParticipants())
            .notes(request.getNotes())
            .equipementId(request.getEquipementId())
            .equipementNom(request.getEquipementNom())
            .statut(StatutReservation.EN_ATTENTE) // Par défaut, en attente
            .build();

        DemandeDeReservation saved = reservationRepository.save(reservation);
        log.info("Réservation créée avec succès: {}", saved.getIdDemandeReservation());

        // Invalider le cache de disponibilité en temps réel
        realTimeAvailabilityService.invalidateCache(salleId, request.getDate());

        // Convertir en réponse avec les informations de la salle
        return mapToResponse(saved, room);
    }

    /**
     * Valider les données de la requête de réservation
     */
    private void validateReservationRequest(CreateReservationRequest request) {
        // Valider que l'heure de fin est supérieure à l'heure de début
        if (request.getHeureFin().isBefore(request.getHeureDebut()) ||
            request.getHeureFin().equals(request.getHeureDebut())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "L'heure de fin doit être supérieure à l'heure de début"
            );
        }

        // Valider les heures (entre 8h et 18h)
        LocalTime heureMin = LocalTime.of(8, 0);
        LocalTime heureMax = LocalTime.of(18, 0);

        if (request.getHeureDebut().isBefore(heureMin) || request.getHeureDebut().isAfter(heureMax)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "L'heure de début doit être comprise entre 8h et 18h"
            );
        }

        if (request.getHeureFin().isBefore(heureMin) || request.getHeureFin().isAfter(heureMax)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "L'heure de fin doit être comprise entre 8h et 18h"
            );
        }
    }

    /**
     * Récupérer toutes les réservations
     * GET /api/reservations
     */
    public List<ReservationResponse> getAllReservations() {
        log.info("Récupération de toutes les réservations");
        List<DemandeDeReservation> reservations = reservationRepository.findAll();
        return reservations.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Récupérer une réservation par ID
     * GET /api/reservations/:id
     */
    public ReservationResponse getReservationById(String id) {
        log.info("Récupération de la réservation: {}", id);
        DemandeDeReservation reservation = reservationRepository
            .findByIdDemandeReservation(id)
            .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID: " + id));
        
        // Récupérer les informations de la salle
        Map<String, Object> room = roomServiceClient.getRoomById(reservation.getSalleId());
        return mapToResponse(reservation, room);
    }

    /**
     * Mettre à jour une réservation
     * PUT /api/reservations/:id
     */
    public ReservationResponse updateReservation(String id, UpdateReservationRequest request) {
        log.info("Mise à jour de la réservation: {}", id);
        DemandeDeReservation reservation = reservationRepository
            .findByIdDemandeReservation(id)
            .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID: " + id));

        // Vérifier les conflits si la date, l'heure ou la salle changent
        LocalDate date = request.getDate() != null ? request.getDate() : reservation.getDate();
        LocalTime heureDebut = request.getHeureDebut() != null ? request.getHeureDebut() : reservation.getHeuredebut();
        LocalTime heureFin = request.getHeureFin() != null ? request.getHeureFin() : reservation.getHeureFin();
        String salleId = request.getSalleId() != null ? request.getSalleId() : reservation.getSalleId();

        if (request.getDate() != null || request.getHeureDebut() != null || 
            request.getHeureFin() != null || request.getSalleId() != null) {
            
            List<DemandeDeReservation> conflicts = reservationRepository.findConflictingReservationsExcluding(
                salleId, date, heureDebut, heureFin, id, StatutReservation.ANNULEE
            );

            if (!conflicts.isEmpty()) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Un conflit de réservation existe déjà pour cette salle à cette date et heure"
                );
            }
        }

        // Mettre à jour les champs
        if (request.getSalleId() != null) reservation.setSalleId(request.getSalleId());
        if (request.getDate() != null) reservation.setDate(request.getDate());
        if (request.getHeureDebut() != null) reservation.setHeuredebut(request.getHeureDebut());
        if (request.getHeureFin() != null) reservation.setHeureFin(request.getHeureFin());
        if (request.getCoursId() != null) reservation.setCoursId(request.getCoursId());
        if (request.getEvenementId() != null) reservation.setEvenementId(request.getEvenementId());
        if (request.getPurpose() != null) reservation.setPurpose(request.getPurpose());
        if (request.getNotes() != null) reservation.setNotes(request.getNotes());
        if (request.getEquipementId() != null) reservation.setEquipementId(request.getEquipementId());
        if (request.getEquipementNom() != null) reservation.setEquipementNom(request.getEquipementNom());

        DemandeDeReservation updated = reservationRepository.save(reservation);
        log.info("Réservation mise à jour: {}", updated.getIdDemandeReservation());

        // Invalider le cache pour l'ancienne et la nouvelle salle si elle a changé
        realTimeAvailabilityService.invalidateCache(updated.getSalleId(), updated.getDate());
        if (request.getSalleId() != null && !request.getSalleId().equals(reservation.getSalleId())) {
            realTimeAvailabilityService.invalidateCache(request.getSalleId(), date);
        }

        Map<String, Object> room = roomServiceClient.getRoomById(updated.getSalleId());
        return mapToResponse(updated, room);
    }

    /**
     * Annuler une réservation
     * PATCH /api/reservations/:id/cancel
     */
    public ReservationResponse cancelReservation(String id) {
        log.info("Annulation de la réservation: {}", id);
        DemandeDeReservation reservation = reservationRepository
            .findByIdDemandeReservation(id)
            .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID: " + id));

        if (reservation.getStatut() == StatutReservation.ANNULEE) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cette réservation est déjà annulée"
            );
        }

        reservation.setStatut(StatutReservation.ANNULEE);
        DemandeDeReservation cancelled = reservationRepository.save(reservation);
        log.info("Réservation annulée: {}", cancelled.getIdDemandeReservation());

        // Invalider le cache de disponibilité
        realTimeAvailabilityService.invalidateCache(cancelled.getSalleId(), cancelled.getDate());

        Map<String, Object> room = roomServiceClient.getRoomById(cancelled.getSalleId());
        return mapToResponse(cancelled, room);
    }

    /**
     * Confirmer une réservation
     * PATCH /api/reservations/:id/confirm
     */
    public ReservationResponse confirmReservation(String id) {
        log.info("Confirmation de la réservation: {}", id);
        DemandeDeReservation reservation = reservationRepository
            .findByIdDemandeReservation(id)
            .orElseThrow(() -> new ResourceNotFoundException("Réservation non trouvée avec l'ID: " + id));

        if (reservation.getStatut() == StatutReservation.CONFIRME) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cette réservation est déjà confirmée"
            );
        }

        if (reservation.getStatut() == StatutReservation.ANNULEE) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Impossible de confirmer une réservation annulée"
            );
        }

        reservation.setStatut(StatutReservation.CONFIRME);
        DemandeDeReservation confirmed = reservationRepository.save(reservation);
        log.info("Réservation confirmée: {}", confirmed.getIdDemandeReservation());

        // Invalider le cache de disponibilité
        realTimeAvailabilityService.invalidateCache(confirmed.getSalleId(), confirmed.getDate());

        Map<String, Object> room = roomServiceClient.getRoomById(confirmed.getSalleId());
        return mapToResponse(confirmed, room);
    }

    /**
     * Supprimer une réservation
     * DELETE /api/reservations/:id
     */
    public void deleteReservation(String id) {
        log.info("Suppression de la réservation: {}", id);
        if (!reservationRepository.existsByIdDemandeReservation(id)) {
            throw new ResourceNotFoundException("Réservation non trouvée avec l'ID: " + id);
        }
        // Récupérer la réservation avant suppression pour invalider le cache
        DemandeDeReservation reservationToDelete = reservationRepository
                .findByIdDemandeReservation(id)
                .orElse(null);
        
        reservationRepository.deleteById(id);
        log.info("Réservation supprimée: {}", id);
        
        // Invalider le cache si la réservation existait
        if (reservationToDelete != null) {
            realTimeAvailabilityService.invalidateCache(
                    reservationToDelete.getSalleId(), 
                    reservationToDelete.getDate());
        }
    }

    /**
     * Récupérer les réservations d'un utilisateur
     * GET /api/reservations/user/:userId
     */
    public List<ReservationResponse> getUserReservations(String userId) {
        log.info("Récupération des réservations de l'utilisateur: {}", userId);
        List<DemandeDeReservation> reservations = reservationRepository.findByUtilisateurId(userId);
        return reservations.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Récupérer les réservations d'une salle
     * GET /api/reservations/room/:roomId
     */
    public List<ReservationResponse> getRoomReservations(String roomId, LocalDate startDate, LocalDate endDate) {
        log.info("Récupération des réservations de la salle: {}", roomId);
        List<DemandeDeReservation> reservations;
        
        if (startDate != null && endDate != null) {
            reservations = reservationRepository.findBySalleIdAndDateBetween(roomId, startDate, endDate);
        } else {
            reservations = reservationRepository.findBySalleId(roomId);
        }
        
        return reservations.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Récupérer les réservations par plage de dates
     * GET /api/reservations/date-range?startDate=xxx&endDate=xxx
     */
    public List<ReservationResponse> getReservationsByDateRange(LocalDate startDate, LocalDate endDate) {
        log.info("Récupération des réservations entre {} et {}", startDate, endDate);
        List<DemandeDeReservation> reservations = reservationRepository.findByDateBetween(startDate, endDate);
        return reservations.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Vérifier la disponibilité d'une salle
     * GET /api/reservations/check-availability?roomId=xxx&startDateTime=xxx&endDateTime=xxx
     */
    public boolean checkAvailability(String roomId, LocalDate date, LocalTime heureDebut, LocalTime heureFin) {
        log.info("Vérification de la disponibilité de la salle {} le {} entre {} et {}", 
                 roomId, date, heureDebut, heureFin);
        
        List<DemandeDeReservation> conflicts = reservationRepository.findConflictingReservations(
            roomId, date, heureDebut, heureFin, StatutReservation.ANNULEE
        );
        
        return conflicts.isEmpty();
    }

    /**
     * Mapper une entité DemandeDeReservation en ReservationResponse
     */
    private ReservationResponse mapToResponse(DemandeDeReservation reservation) {
        Map<String, Object> room = roomServiceClient.getRoomById(reservation.getSalleId());
        return mapToResponse(reservation, room);
    }

    /**
     * Mapper une entité DemandeDeReservation en ReservationResponse avec les infos de la salle
     */
    private ReservationResponse mapToResponse(DemandeDeReservation reservation, Map<String, Object> room) {
        return ReservationResponse.builder()
            .idDemandeReservation(reservation.getIdDemandeReservation())
            .salleId(reservation.getSalleId())
            .salleNom(room != null && !room.isEmpty() ? 
            (String) room.getOrDefault("nomsalle", "Salle inconnue") : "Salle inconnue")
            .utilisateurId(reservation.getUtilisateurId())
            .date(reservation.getDate())
            .heureDebut(reservation.getHeuredebut())
            .heureFin(reservation.getHeureFin())
            .statut(reservation.getStatut())
            .coursId(reservation.getCoursId())
            .evenementId(reservation.getEvenementId())
            .purpose(reservation.getPurpose())
            .numberOfParticipants(reservation.getNumberOfParticipants())
            .notes(reservation.getNotes())
            .equipementId(reservation.getEquipementId())
            .equipementNom(reservation.getEquipementNom())
            .createdAt(reservation.getCreatedAt())
            .updatedAt(reservation.getUpdatedAt())
            .build();
    }
}
