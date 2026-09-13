package com.iusjc.timora.user.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.iusjc.timora.user.entity.User;

import java.io.IOException;

/**
 * Désérialiseur personnalisé pour RoleUtilisateur
 * Permet de mapper les valeurs du frontend (TEACHER, ADMIN) vers les valeurs backend (ENSEIGNANT, ADMINISTRATEUR)
 */
public class RoleUtilisateurDeserializer extends JsonDeserializer<User.RoleUtilisateur> {

    @Override
    public User.RoleUtilisateur deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        // Normaliser la valeur en majuscules
        String normalized = value.toUpperCase().trim();
        
        // Mapper les valeurs du frontend vers les valeurs backend
        switch (normalized) {
            case "TEACHER":
            case "ENSEIGNANT":
                return User.RoleUtilisateur.ENSEIGNANT;
            case "ADMIN":
            case "ADMINISTRATEUR":
            case "ADMINISTRATOR":
                return User.RoleUtilisateur.ADMINISTRATEUR;
            default:
                // Essayer de trouver directement la valeur
                try {
                    return User.RoleUtilisateur.valueOf(normalized);
                } catch (IllegalArgumentException e) {
                    throw new IOException("Valeur de rôle invalide: " + value + ". Valeurs acceptées: ENSEIGNANT, ADMINISTRATEUR, TEACHER, ADMIN", e);
                }
        }
    }
}

