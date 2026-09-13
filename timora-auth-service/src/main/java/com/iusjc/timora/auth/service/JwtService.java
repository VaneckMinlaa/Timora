package com.iusjc.timora.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service pour la gestion des JWT
 */
@Service
@Slf4j
public class JwtService {
    
    @Value("${jwt.secret:timora-secret-key-for-jwt-token-generation-minimum-256-bits}")
    private String secret;
    
    @Value("${jwt.expiration:86400000}") // 24 heures par défaut
    private Long expiration;
    
    @Value("${jwt.refresh-expiration:604800000}") // 7 jours par défaut
    private Long refreshExpiration;
    
    /**
     * Génère un token JWT pour un utilisateur
     */
    public String generateToken(String userId, String email, String firstName, String lastName, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("firstName", firstName);
        claims.put("lastName", lastName);
        claims.put("role", role);
        
        return createToken(claims, userId, expiration);
    }
    
    /**
     * Génère un refresh token
     */
    public String generateRefreshToken(String userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "refresh");
        
        return createToken(claims, userId, refreshExpiration);
    }
    
    /**
     * Crée un token JWT
     */
    private String createToken(Map<String, Object> claims, String subject, Long expirationTime) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);
        
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    /**
     * Extrait le userId du token
     */
    public String extractUserId(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    /**
     * Extrait l'email du token
     */
    public String extractEmail(String token) {
        return extractClaim(token, claims -> claims.get("email", String.class));
    }
    
    /**
     * Extrait une claim spécifique du token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Extrait toutes les claims du token
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    /**
     * Vérifie si le token est expiré
     */
    public Boolean isTokenExpired(String token) {
        try {
            return extractClaim(token, Claims::getExpiration).before(new Date());
        } catch (Exception e) {
            log.error("Erreur lors de la vérification de l'expiration du token: {}", e.getMessage());
            return true;
        }
    }
    
    /**
     * Valide un token
     */
    public Boolean validateToken(String token, String userId) {
        try {
            final String tokenUserId = extractUserId(token);
            return (tokenUserId.equals(userId) && !isTokenExpired(token));
        } catch (Exception e) {
            log.error("Erreur lors de la validation du token: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Obtient la clé de signature
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        // JWT nécessite une clé d'au moins 256 bits (32 bytes)
        if (keyBytes.length < 32) {
            // Padding avec des zéros si nécessaire
            byte[] paddedKey = new byte[32];
            System.arraycopy(keyBytes, 0, paddedKey, 0, Math.min(keyBytes.length, 32));
            keyBytes = paddedKey;
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

