package com.iusjc.timora.user.repository;

import com.iusjc.timora.user.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository pour les tokens de réinitialisation de mot de passe
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
    
    /**
     * Trouve un token par email et code
     */
    Optional<PasswordResetToken> findByEmailAndCode(String email, String code);
    
    /**
     * Trouve le dernier token valide pour un email
     */
    Optional<PasswordResetToken> findFirstByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
        String email, 
        LocalDateTime now
    );
    
    /**
     * Supprime tous les tokens expirés
     */
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
    
    /**
     * Supprime tous les tokens d'un email
     */
    void deleteByEmail(String email);
}
