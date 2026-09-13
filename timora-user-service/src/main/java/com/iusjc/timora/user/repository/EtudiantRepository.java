package com.iusjc.timora.user.repository;

import com.iusjc.timora.user.entity.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des étudiants
 */
@Repository
public interface EtudiantRepository extends JpaRepository<Etudiant, String> {

    Optional<Etudiant> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Etudiant> findByFiliereId(String filiereId);

    List<Etudiant> findByClasseId(String classeId);

    List<Etudiant> findByNiveau(String niveau);

    @Query("SELECT e FROM Etudiant e WHERE " +
           "LOWER(e.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Etudiant> searchEtudiants(@Param("search") String search);
}
