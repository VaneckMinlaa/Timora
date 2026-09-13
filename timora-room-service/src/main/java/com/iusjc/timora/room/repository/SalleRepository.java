package com.iusjc.timora.room.repository;

import com.iusjc.timora.room.entity.Salle;
import com.iusjc.timora.room.entity.TypeSalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Salle
 * Selon UML :
 * - 1 Salle -> 1..* Equipement
 * - 1 Salle -> 1..* DemandeDeReservation (dans ReservationService)
 */
@Repository
public interface SalleRepository extends JpaRepository<Salle, String> {

    /**
     * Trouver les salles par type
     */
    List<Salle> findByTypeSalle(TypeSalle typeSalle);

    Optional<Salle> findByNomsalleIgnoreCase(String nomsalle);

    /**
     * Trouver les salles par capacité minimale
     */
    @Query("SELECT s FROM Salle s WHERE s.capacite >= :capaciteMin")
    List<Salle> findByCapaciteGreaterThanEqual(@Param("capaciteMin") Integer capaciteMin);

    /**
     * Rechercher des salles par nom (recherche partielle)
     * GET /api/rooms/search?query=xxx
     */
    @Query("SELECT s FROM Salle s WHERE LOWER(s.nomsalle) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Salle> searchByNom(@Param("query") String query);


    @Query("SELECT s FROM Salle s WHERE s.typeSalle = :typeSalle AND s.capacite >= :capaciteMin")
    List<Salle> findAvailableRoomsByCriteria(
            @Param("typeSalle") TypeSalle typeSalle,
            @Param("capaciteMin") Integer capaciteMin
    );
}
