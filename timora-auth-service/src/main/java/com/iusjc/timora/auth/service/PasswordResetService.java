package com.iusjc.timora.auth.service;

import com.iusjc.timora.auth.client.UserServiceClient;
import com.iusjc.timora.auth.client.NotificationServiceClient;
import com.iusjc.timora.auth.dto.SendResetCodeRequest;
import com.iusjc.timora.auth.dto.SendNewPasswordRequest;
import com.iusjc.timora.auth.model.PasswordResetToken;
import com.iusjc.timora.auth.repository.PasswordResetTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@Transactional
public class PasswordResetService {
    
    private final PasswordResetTokenRepository resetTokenRepository;
    private final UserServiceClient userServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    private final SecureRandom random;
    
    private static final int CODE_EXPIRATION_MINUTES = 15;
    private static final int PASSWORD_LENGTH = 12;
    
    public PasswordResetService(
        PasswordResetTokenRepository resetTokenRepository,
        UserServiceClient userServiceClient,
        NotificationServiceClient notificationServiceClient
    ) {
        this.resetTokenRepository = resetTokenRepository;
        this.userServiceClient = userServiceClient;
        this.notificationServiceClient = notificationServiceClient;
        this.random = new SecureRandom();
    }
    
    public void requestPasswordReset(String email) {
        log.info("🔐 Demande de réinitialisation de mot de passe pour: {}", email);
        
        try {
            Map<String, Object> user = userServiceClient.findByEmail(email);
            if (user == null || user.isEmpty()) {
                log.warn("⚠️ Utilisateur non trouvé pour l'email: {}", email);
                throw new RuntimeException("Aucun compte n'est associé à cette adresse email");
            }
        } catch (RuntimeException e) {
            // Relancer les RuntimeException telles quelles (ex: utilisateur non trouvé)
            throw e;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la vérification de l'utilisateur: {}", e.getMessage());
            throw new RuntimeException("Service utilisateur indisponible. Vérifiez que le UserService est démarré et enregistré dans Eureka.");
        }
        
        // Marquer les anciens tokens comme utilisés au lieu de les supprimer
        resetTokenRepository.findFirstByEmailOrderByCreatedAtDesc(email).ifPresent(oldToken -> {
            oldToken.setUsed(true);
            resetTokenRepository.save(oldToken);
            log.info("🔄 Ancien token marqué comme utilisé pour: {}", email);
        });
        
        String code = generateCode();
        
        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setCode(code);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES));
        token.setUsed(false);
        
        resetTokenRepository.save(token);
        log.info("✅ Code de réinitialisation généré pour: {}", email);
        log.info("🔑 CODE GÉNÉRÉ: {}", code);  // Afficher le code dans les logs
        
        sendResetCodeEmail(email, code);
    }
    
    public boolean verifyResetCode(String email, String code) {
        log.info("═══════════════════════════════════════════════════════");
        log.info("🔍 DÉBUT VÉRIFICATION DU CODE");
        log.info("═══════════════════════════════════════════════════════");
        log.info("📧 Email: {}", email);
        log.info("📝 Code reçu: '{}' (longueur: {})", code, code.length());
        
        // Afficher chaque caractère du code
        log.info("🔤 Caractères du code reçu:");
        for (int i = 0; i < code.length(); i++) {
            log.info("   Position {}: '{}' (ASCII: {})", i, code.charAt(i), (int)code.charAt(i));
        }
        
        // Nettoyer le code (enlever espaces, etc.)
        String cleanCode = code.trim();
        log.info("📝 Code nettoyé: '{}' (longueur: {})", cleanCode, cleanCode.length());
        
        // Chercher le token en base
        log.info("🔍 Recherche du token en base...");
        PasswordResetToken token = resetTokenRepository
            .findByEmailAndCode(email, cleanCode)
            .orElse(null);
        
        if (token == null) {
            log.error("❌ AUCUN TOKEN TROUVÉ avec email='{}' et code='{}'", email, cleanCode);
            
            // Afficher le dernier code pour cet email (debug)
            log.info("🔍 Recherche du dernier token pour cet email...");
            resetTokenRepository.findFirstByEmailOrderByCreatedAtDesc(email).ifPresentOrElse(
                t -> {
                    log.info("📋 DERNIER TOKEN TROUVÉ:");
                    log.info("   Code en base: '{}'", t.getCode());
                    log.info("   Longueur: {}", t.getCode().length());
                    log.info("   Expiré: {}", t.getExpiresAt().isBefore(LocalDateTime.now()));
                    log.info("   Expire à: {}", t.getExpiresAt());
                    log.info("   Maintenant: {}", LocalDateTime.now());
                    log.info("   Utilisé: {}", t.getUsed());
                    log.info("   Créé à: {}", t.getCreatedAt());
                    
                    // Comparer caractère par caractère
                    log.info("🔤 Comparaison caractère par caractère:");
                    String codeInDb = t.getCode();
                    int maxLen = Math.max(cleanCode.length(), codeInDb.length());
                    for (int i = 0; i < maxLen; i++) {
                        char c1 = i < cleanCode.length() ? cleanCode.charAt(i) : ' ';
                        char c2 = i < codeInDb.length() ? codeInDb.charAt(i) : ' ';
                        boolean match = c1 == c2;
                        log.info("   Position {}: Reçu='{}' (ASCII:{}) vs Base='{}' (ASCII:{}) - Match: {}", 
                            i, c1, (int)c1, c2, (int)c2, match);
                    }
                },
                () -> log.error("❌ AUCUN TOKEN TROUVÉ pour l'email: {}", email)
            );
            
            log.info("═══════════════════════════════════════════════════════");
            return false;
        }
        
        log.info("✅ Token trouvé en base!");
        
        if (token.getUsed()) {
            log.error("❌ Code déjà utilisé pour: {}", email);
            log.info("═══════════════════════════════════════════════════════");
            return false;
        }
        
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.error("❌ Code expiré pour: {}", email);
            log.info("   Expiré à: {}", token.getExpiresAt());
            log.info("   Maintenant: {}", LocalDateTime.now());
            log.info("═══════════════════════════════════════════════════════");
            return false;
        }
        
        log.info("✅✅✅ CODE VALIDE POUR: {}", email);
        log.info("═══════════════════════════════════════════════════════");
        return true;
    }
    
    public String resetPassword(String email, String code) {
        log.info("🔄 Réinitialisation du mot de passe pour: {}", email);
        
        // Nettoyer le code
        String cleanCode = code.trim();
        
        if (!verifyResetCode(email, cleanCode)) {
            throw new RuntimeException("Code invalide ou expiré");
        }
        
        PasswordResetToken token = resetTokenRepository
            .findByEmailAndCode(email, cleanCode)
            .orElseThrow(() -> new RuntimeException("Token non trouvé"));
        
        token.setUsed(true);
        resetTokenRepository.save(token);
        
        String newPassword = generatePassword(PASSWORD_LENGTH);
        
        try {
            Map<String, Object> user = userServiceClient.findByEmail(email);
            String userId = (String) user.get("id");
            
            updateUserPassword(userId, newPassword);
            
            log.info("✅ Mot de passe réinitialisé pour: {}", email);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la mise à jour du mot de passe: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la réinitialisation du mot de passe");
        }
        
        sendNewPasswordEmail(email, newPassword);
        
        return newPassword;
    }
    
    private String generateCode() {
        int code = random.nextInt(900000) + 100000;
        return String.valueOf(code);
    }
    
    private String generatePassword(int length) {
        String upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lower = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        String allChars = upper + lower + digits + special;
        
        StringBuilder password = new StringBuilder(length);
        
        password.append(upper.charAt(random.nextInt(upper.length())));
        password.append(lower.charAt(random.nextInt(lower.length())));
        password.append(digits.charAt(random.nextInt(digits.length())));
        password.append(special.charAt(random.nextInt(special.length())));
        
        for (int i = password.length(); i < length; i++) {
            password.append(allChars.charAt(random.nextInt(allChars.length())));
        }
        
        return shuffleString(password.toString());
    }
    
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
    
    private void sendResetCodeEmail(String email, String code) {
        try {
            SendResetCodeRequest request = SendResetCodeRequest.builder()
                .to(email)
                .code(code)
                .build();
            
            notificationServiceClient.sendResetCode(request);
            log.info("📧 Email de code envoyé à: {}", email);
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email: {}", e.getMessage());
            log.warn("⚠️ MODE DÉVELOPPEMENT - Code de réinitialisation: {}", code);
        }
    }
    
    private void sendNewPasswordEmail(String email, String password) {
        try {
            SendNewPasswordRequest request = SendNewPasswordRequest.builder()
                .to(email)
                .password(password)
                .build();
            
            notificationServiceClient.sendNewPassword(request);
            log.info(" Email de nouveau mot de passe envoyé à: {}", email);
        } catch (Exception e) {
            log.error(" Erreur lors de l'envoi de l'email: {}", e.getMessage());
            log.warn(" MODE DÉVELOPPEMENT - Nouveau mot de passe: {}", password);
        }
    }
    
    private void updateUserPassword(String userId, String newPassword) {
        try {
            // Utiliser le client Feign au lieu de RestTemplate direct
            Map<String, String> passwordRequest = new HashMap<>();
            passwordRequest.put("newPassword", newPassword);
            
            userServiceClient.resetPassword(userId, passwordRequest);
            
            log.info(" Mot de passe mis à jour pour l'utilisateur: {}", userId);
        } catch (Exception e) {
            log.error(" Erreur lors de la mise à jour du mot de passe: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la mise à jour du mot de passe");
        }
    }
    
    @Transactional
    public void cleanupExpiredTokens() {
        resetTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        log.info(" Tokens expirés nettoyés");
    }
}
