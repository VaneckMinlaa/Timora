package com.iusjc.timora.reservation.repository;

import com.iusjc.timora.reservation.entity.Disponibilite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Disponibilite
 */
@Repository
public interface DisponibiliteRepository extends JpaRepository<Disponibilite, String> {

    /**
     * Trouver toutes les disponibilités d'un utilisateur (enseignant)
     * GET /api/reservations/disponibilites/user/:userId
     */
    List<Disponibilite> findByUtilisateurId(String utilisateurId);

    /**
     * Trouver une disponibilité par ID
     * GET /api/reservations/disponibilites/:id
     */
    Optional<Disponibilite> findByIdDisponibilite(String idDisponibilite);

    /**
     * Trouver les disponibilités par jour de la semaine
     * GET /api/reservations/disponibilites/day/:jour
     */
    List<Disponibilite> findByJour(String jour);

    /**
     * Trouver les disponibilités par jour et utilisateur
     */
    List<Disponibilite> findByJourAndUtilisateurId(String jour, String utilisateurId);

    /**
     * Trouver les disponibilités par EmploiDuTemps
     */
    List<Disponibilite> findByEmploiDuTempsId(String emploiDuTempsId);

    /**
     * Vérifier si une disponibilité existe pour un utilisateur, jour et créneau horaire
     * Vérifie les chevauchements de créneaux horaires
     */
    @Query("SELECT d FROM Disponibilite d WHERE d.utilisateurId = :utilisateurId " +
           "AND d.jour = :jour " +
           "AND ((d.heureDebut <= :heureDebut AND d.heureFin > :heureDebut) " +
           "OR (d.heureDebut < :heureFin AND d.heureFin >= :heureFin) " +
           "OR (d.heureDebut >= :heureDebut AND d.heureFin <= :heureFin))")
    List<Disponibilite> findOverlappingDisponibilites(
            @Param("utilisateurId") String utilisateurId,
            @Param("jour") String jour,
            @Param("heureDebut") java.time.LocalTime heureDebut,
            @Param("heureFin") java.time.LocalTime heureFin
    );

    /**
     * Vérifier si une disponibilité existe par ID
     */
    boolean existsByIdDisponibilite(String idDisponibilite);

    /**
     * Trouver les disponibilités par date
     */
    List<Disponibilite> findByDate(LocalDate date);

    /**
     * Trouver les disponibilités par utilisateur et date
     */
    List<Disponibilite> findByUtilisateurIdAndDate(String utilisateurId, LocalDate date);

    /**
     * Trouver les disponibilités par utilisateur et plage de dates
     */
    List<Disponibilite> findByUtilisateurIdAndDateBetween(String utilisateurId, LocalDate dateStart, LocalDate dateEnd);

    /**
     * Vérifier les chevauchements par date (au lieu de jour)
     */
    @Query("SELECT d FROM Disponibilite d WHERE d.utilisateurId = :utilisateurId " +
           "AND d.date = :date " +
           "AND ((d.heureDebut <= :heureDebut AND d.heureFin > :heureDebut) " +
           "OR (d.heureDebut < :heureFin AND d.heureFin >= :heureFin) " +
           "OR (d.heureDebut >= :heureDebut AND d.heureFin <= :heureFin))")
    List<Disponibilite> findOverlappingDisponibilitesByDate(
            @Param("utilisateurId") String utilisateurId,
            @Param("date") LocalDate date,
            @Param("heureDebut") java.time.LocalTime heureDebut,
            @Param("heureFin") java.time.LocalTime heureFin
    );

    /**
     * Trouver toutes les disponibilités par plage de dates (pour admin)
     * GET /api/reservations/disponibilites/all/range?startDate=xxx&endDate=xxx
     */
    List<Disponibilite> findByDateBetween(LocalDate dateStart, LocalDate dateEnd);
}

