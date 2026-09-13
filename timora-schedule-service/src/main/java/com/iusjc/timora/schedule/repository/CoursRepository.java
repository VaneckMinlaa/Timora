package com.iusjc.timora.schedule.repository;

import com.iusjc.timora.schedule.entity.Cours;
import com.iusjc.timora.schedule.entity.TypeCours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour la gestion des cours
 */
@Repository
public interface CoursRepository extends JpaRepository<Cours, String> {

    /**
     * Trouve tous les cours par type
     */
    List<Cours> findByType(TypeCours type);

    /**
     * Trouve tous les cours par enseignant
     */
    List<Cours> findByEnseignantId(String enseignantId);

    /**
     * Trouve tous les cours par emploi du temps
     */
    List<Cours> findByEmploiDuTempsId(String emploiDuTempsId);

    /**
     * Trouve tous les cours d'une classe donnée
     */
    @Query("SELECT c FROM Cours c WHERE :classeId MEMBER OF c.classeIds")
    List<Cours> findByClasseId(@Param("classeId") String classeId);

    /**
     * Trouve tous les cours d'une UE donnée
     */
    @Query("SELECT c FROM Cours c WHERE :ueId MEMBER OF c.ueIds")
    List<Cours> findByUeId(@Param("ueId") String ueId);

    /**
     * Trouve tous les cours créés après une date donnée
     */
    List<Cours> findByCreatedAtAfter(LocalDateTime date);

    /**
     * Trouve les cours par enseignant et type
     */
    List<Cours> findByEnseignantIdAndType(String enseignantId, TypeCours type);

    /**
     * Vérifie si un cours identique existe déjà (même nom + enseignant + semestre)
     * Utilisé pour éviter les doublons lors de la création
     */
    boolean existsByNomIgnoreCaseAndEnseignantIdAndSemestre(String nom, String enseignantId, com.iusjc.timora.schedule.entity.Semestre semestre);

    /**
     * Trouve tous les cours avec le même nom et enseignant
     */
    List<Cours> findByNomIgnoreCaseAndEnseignantId(String nom, String enseignantId);
}
