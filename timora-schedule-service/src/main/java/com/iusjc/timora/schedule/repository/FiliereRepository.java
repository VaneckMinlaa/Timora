package com.iusjc.timora.schedule.repository;

import com.iusjc.timora.schedule.entity.Filiere;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour la gestion des filières
 */
@Repository
public interface FiliereRepository extends JpaRepository<Filiere, String> {

    /**
     * Trouve toutes les filières d'une école
     */
    List<Filiere> findByEcoleId(String ecoleId);

    /**
     * Vérifie si une filière existe par nom
     */
    boolean existsByNom(String nom);
}
