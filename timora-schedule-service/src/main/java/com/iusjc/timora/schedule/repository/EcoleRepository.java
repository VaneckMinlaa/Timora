package com.iusjc.timora.schedule.repository;

import com.iusjc.timora.schedule.entity.Ecole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour la gestion des écoles
 */
@Repository
public interface EcoleRepository extends JpaRepository<Ecole, String> {

    /**
     * Trouve une école par son nom
     */
    Optional<Ecole> findByNomEcole(String nomEcole);

    /**
     * Vérifie si une école existe par son nom
     */
    boolean existsByNomEcole(String nomEcole);
}
