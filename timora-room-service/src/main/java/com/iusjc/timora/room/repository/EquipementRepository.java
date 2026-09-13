package com.iusjc.timora.room.repository;

import com.iusjc.timora.room.entity.Equipement;
import com.iusjc.timora.room.entity.EtatEquipement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'entité Equipement
 */
@Repository
public interface EquipementRepository extends JpaRepository<Equipement, String> {
    
    /**
     * Trouver tous les équipements d'une salle
     */
    List<Equipement> findBySalleId(String salleId);

    /**
     * Trouver tous les équipements d'une salle avec un statut spécifique
     */
    List<Equipement> findBySalleIdAndStatut(String salleId, EtatEquipement statut);

    /**
     * Trouver tous les équipements par statut
     */
    List<Equipement> findByStatut(EtatEquipement statut);
    
    /**
     * Rechercher des équipements par nom (recherche partielle insensible à la casse)
     */
    @Query("SELECT e FROM Equipement e WHERE LOWER(e.nom) LIKE LOWER(CONCAT('%', :nom, '%'))")
    List<Equipement> searchByNom(@Param("nom") String nom);
    
    /**
     * Compter les équipements par statut pour une salle donnée
     */
    @Query("SELECT COUNT(e) FROM Equipement e WHERE e.salleId = :salleId AND e.statut = :statut")
    long countBySalleIdAndStatut(@Param("salleId") String salleId, @Param("statut") EtatEquipement statut);
}
