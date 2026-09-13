package com.iusjc.timora.schedule.repository;

import com.iusjc.timora.schedule.entity.EmploiDuTemps;
import com.iusjc.timora.schedule.entity.StatutEmp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour la gestion des emplois du temps
 */
@Repository
public interface EmploiDuTempsRepository extends JpaRepository<EmploiDuTemps, String> {

    /**
     * Trouve tous les emplois du temps d'un enseignant
     */
    List<EmploiDuTemps> findByEnseignantId(String enseignantId);

    /**
     * Trouve tous les emplois du temps par statut
     */
    List<EmploiDuTemps> findByStatut(StatutEmp statut);

    /**
     * Trouve tous les emplois du temps d'un enseignant et par statut
     */
    List<EmploiDuTemps> findByEnseignantIdAndStatut(String enseignantId, StatutEmp statut);

    /**
     * Trouve les emplois du temps actifs à une date donnée
     */
    List<EmploiDuTemps> findByStatutAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(StatutEmp statut, java.time.LocalDate date1, java.time.LocalDate date2);
}
