package com.iusjc.timora.user.repository;

import com.iusjc.timora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des utilisateurs
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    /**
     * Trouve un utilisateur par email
     */
    Optional<User> findByEmail(String email);

    /**
     * Vérifie si un email existe
     */
    boolean existsByEmail(String email);

    /**
     * Trouve tous les utilisateurs par rôle
     */
    List<User> findByRole(User.RoleUtilisateur role);

    /**
     * Trouve tous les utilisateurs actifs/inactifs
     */
    List<User> findByIsActive(Boolean isActive);

    /**
     * Trouve tous les utilisateurs par rôle et statut actif
     */
    List<User> findByRoleAndIsActive(User.RoleUtilisateur role, Boolean isActive);

    /**
     * Recherche d'utilisateurs par nom, prénom ou email
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<User> searchUsers(@Param("search") String search);

    /**
     * Compte le nombre d'utilisateurs actifs
     */
    long countByIsActiveTrue();

    /**
     * Compte le nombre d'utilisateurs par rôle
     */
    long countByRole(User.RoleUtilisateur role);

    /**
     * Vérifie si un utilisateur existe avec le même nom et prénom
     */
    boolean existsByNomAndPrenom(String nom, String prenom);

    /**
     * Vérifie si un utilisateur existe avec le même numéro de téléphone
     */
    boolean existsByTelephone(Integer telephone);

    /**
     * Trouve un utilisateur par téléphone
     */
    Optional<User> findByTelephone(Integer telephone);

    /**
     * Trouve un utilisateur par nom et prénom
     */
    Optional<User> findByNomAndPrenom(String nom, String prenom);
}

