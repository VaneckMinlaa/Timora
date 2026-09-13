package com.iusjc.timora.user.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Random;

/**
 * Service pour générer des mots de passe aléatoires sécurisés
 */
@Service
public class PasswordGeneratorService {

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SPECIAL;
    
    private static final int DEFAULT_LENGTH = 12;
    private final Random random = new SecureRandom();

    /**
     * Génère un mot de passe aléatoire sécurisé
     * @return Mot de passe généré
     */
    public String generatePassword() {
        return generatePassword(DEFAULT_LENGTH);
    }

    /**
     * Génère un mot de passe aléatoire sécurisé avec une longueur spécifiée
     * @param length Longueur du mot de passe
     * @return Mot de passe généré
     */
    public String generatePassword(int length) {
        if (length < 8) {
            length = 8; // Minimum de sécurité
        }
        
        StringBuilder password = new StringBuilder(length);
        
        // Assurer au moins un caractère de chaque type
        password.append(UPPER.charAt(random.nextInt(UPPER.length())));
        password.append(LOWER.charAt(random.nextInt(LOWER.length())));
        password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(random.nextInt(SPECIAL.length())));
        
        // Remplir le reste avec des caractères aléatoires
        for (int i = password.length(); i < length; i++) {
            password.append(ALL_CHARS.charAt(random.nextInt(ALL_CHARS.length())));
        }
        
        // Mélanger les caractères pour plus de sécurité
        return shuffleString(password.toString());
    }
    
    /**
     * Mélange les caractères d'une chaîne
     */
    private String shuffleString(String str) {
        char[] chars = str.toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }
}

