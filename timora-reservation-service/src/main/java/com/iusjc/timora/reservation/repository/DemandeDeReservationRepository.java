package com.iusjc.timora.reservation.repository;

import com.iusjc.timora.reservation.entity.DemandeDeReservation;
import com.iusjc.timora.reservation.entity.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité DemandeDeReservation
 */
@Repository
public interface DemandeDeReservationRepository extends JpaRepository<DemandeDeReservation, String> {

    /**
     * Trouver toutes les réservations d'un utilisateur
     * GET /api/reservations/user/:userId
     */
    List<DemandeDeReservation> findByUtilisateurId(String utilisateurId);

    /**
     * Trouver toutes les réservations d'une salle
     * GET /api/reservations/room/:roomId
     */
    List<DemandeDeReservation> findBySalleId(String salleId);

    /**
     * Trouver une réservation par ID
     * GET /api/reservations/:id
     */
    Optional<DemandeDeReservation> findByIdDemandeReservation(String idDemandeReservation);

    /**
     * Trouver les réservations par statut
     */
    List<DemandeDeReservation> findByStatut(StatutReservation statut);

    /**
     * Trouver les réservations d'un utilisateur par statut
     */
    List<DemandeDeReservation> findByUtilisateurIdAndStatut(String utilisateurId, StatutReservation statut);

    /**
     * Trouver les réservations d'une salle par statut
     */
    List<DemandeDeReservation> findBySalleIdAndStatut(String salleId, StatutReservation statut);

    /**
     * Trouver les réservations par date
     */
    List<DemandeDeReservation> findByDate(LocalDate date);

    /**
     * Trouver les réservations par date et salle
     */
    List<DemandeDeReservation> findByDateAndSalleId(LocalDate date, String salleId);

    /**
     * Vérifier les conflits de réservation pour une salle à une date et heure donnée
     * Vérifie si une réservation existe déjà avec un chevauchement temporel
     */
    @Query("SELECT d FROM DemandeDeReservation d WHERE d.salleId = :salleId " +
           "AND d.date = :date " +
           "AND d.statut <> :statutAnnulee " +
           "AND ((d.heuredebut <= :heureDebut AND d.heureFin > :heureDebut) " +
           "OR (d.heuredebut < :heureFin AND d.heureFin >= :heureFin) " +
           "OR (d.heuredebut >= :heureDebut AND d.heureFin <= :heureFin))")
    List<DemandeDeReservation> findConflictingReservations(
            @Param("salleId") String salleId,
            @Param("date") LocalDate date,
            @Param("heureDebut") LocalTime heureDebut,
            @Param("heureFin") LocalTime heureFin,
            @Param("statutAnnulee") StatutReservation statutAnnulee
    );

    /**
     * Vérifier les conflits de réservation (version avec exclusion d'une réservation existante pour la mise à jour)
     */
    @Query("SELECT d FROM DemandeDeReservation d WHERE d.salleId = :salleId " +
           "AND d.date = :date " +
           "AND d.idDemandeReservation <> :excludeId " +
           "AND d.statut <> :statutAnnulee " +
           "AND ((d.heuredebut <= :heureDebut AND d.heureFin > :heureDebut) " +
           "OR (d.heuredebut < :heureFin AND d.heureFin >= :heureFin) " +
           "OR (d.heuredebut >= :heureDebut AND d.heureFin <= :heureFin))")
    List<DemandeDeReservation> findConflictingReservationsExcluding(
            @Param("salleId") String salleId,
            @Param("date") LocalDate date,
            @Param("heureDebut") LocalTime heureDebut,
            @Param("heureFin") LocalTime heureFin,
            @Param("excludeId") String excludeId,
            @Param("statutAnnulee") StatutReservation statutAnnulee
    );

    /**
     * Trouver les réservations par plage de dates
     * GET /api/reservations/date-range?startDate=xxx&endDate=xxx
     */
    List<DemandeDeReservation> findByDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Trouver les réservations d'un utilisateur par plage de dates
     */
    List<DemandeDeReservation> findByUtilisateurIdAndDateBetween(String utilisateurId, LocalDate startDate, LocalDate endDate);

    /**
     * Trouver les réservations d'une salle par plage de dates
     */
    List<DemandeDeReservation> findBySalleIdAndDateBetween(String salleId, LocalDate startDate, LocalDate endDate);

    /**
     * Vérifier si une réservation existe
     */
    boolean existsByIdDemandeReservation(String idDemandeReservation);

    /**
     * Trouver les réservations à venir (date >= aujourd'hui)
     */
    @Query("SELECT d FROM DemandeDeReservation d WHERE d.date >= :today " +
           "AND d.statut <> :statutAnnulee " +
           "ORDER BY d.date ASC, d.heuredebut ASC")
    List<DemandeDeReservation> findUpcomingReservations(
            @Param("today") LocalDate today,
            @Param("statutAnnulee") StatutReservation statutAnnulee
    );

    /**
     * Trouver les réservations passées (date < aujourd'hui)
     */
    @Query("SELECT d FROM DemandeDeReservation d WHERE d.date < :today " +
           "ORDER BY d.date DESC, d.heuredebut DESC")
    List<DemandeDeReservation> findPastReservations(@Param("today") LocalDate today);
}
