package com.iusjc.timora.schedule.repository;

import com.iusjc.timora.schedule.entity.Classe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour la gestion des classes
 */
@Repository
public interface ClasseRepository extends JpaRepository<Classe, String> {

    /**
     * Trouve toutes les classes d'une filière
     */
    List<Classe> findByFiliereId(String filiereId);

    /**
     * Trouve toutes les classes d'une filière et d'un niveau
     */
    List<Classe> findByFiliereIdAndNiveau(String filiereId, String niveau);

    /**
     * Trouve toutes les classes d'une école
     */
    List<Classe> findByEcoleId(String ecoleId);

    /**
     * Trouve toutes les classes d'une filière et d'une école
     */
    List<Classe> findByFiliereIdAndEcoleId(String filiereId, String ecoleId);

    /**
     * Vérifie si une classe existe par nom
     */
    boolean existsByNom(String nom);
}
