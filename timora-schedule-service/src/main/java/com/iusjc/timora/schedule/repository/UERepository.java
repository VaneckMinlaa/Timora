package com.iusjc.timora.schedule.repository;

import com.iusjc.timora.schedule.entity.UE;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des UEs
 */
@Repository
public interface UERepository extends JpaRepository<UE, String> {

    /**
     * Trouve une UE par code
     */
    Optional<UE> findByCodeUE(String codeUE);

    /**
     * Trouve toutes les UEs d'une filière
     */
    List<UE> findByFiliereId(String filiereId);

    /**
     * Vérifie si une UE existe par code
     */
    boolean existsByCodeUE(String codeUE);
}
