package com.iusjc.timora.notification.controller;

import com.iusjc.timora.notification.dto.SendPasswordEmailRequest;
import com.iusjc.timora.notification.dto.SendResetCodeRequest;
import com.iusjc.timora.notification.dto.SendNewPasswordRequest;
import com.iusjc.timora.notification.dto.SendAccountBlockedEmailRequest;
import com.iusjc.timora.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour les notifications
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final EmailService emailService;

    /**
     * POST /api/notifications/email/password
     * Envoie un email avec le mot de passe à un nouvel utilisateur
     */
    @PostMapping("/email/password")
    public ResponseEntity<Void> sendPasswordEmail(@RequestBody SendPasswordEmailRequest request) {
        try {
            log.info(" Reçu demande d'envoi d'email avec mot de passe");
            log.info("   Destinataire: {}", request.getTo());
            log.info("   Nom: {} {}", request.getFirstName(), request.getLastName());
            
            emailService.sendPasswordEmail(
                request.getTo(),
                request.getFirstName(),
                request.getLastName(),
                request.getPassword()
            );
            
            log.info(" Email envoyé avec succès à: {}", request.getTo());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error(" ERREUR lors de l'envoi de l'email à {}: {}", request.getTo(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/notifications/email/test
     * Endpoint de test pour vérifier l'envoi d'email
     */
    @PostMapping("/email/test")
    public ResponseEntity<String> testEmail(@RequestParam(required = false) String to) {
        try {
            String testEmail = to != null && !to.isEmpty() ? to : "minlaaalex0@gmail.com";
            log.info(" Test d'envoi d'email à: {}", testEmail);
            
            emailService.sendPasswordEmail(
                testEmail,
                "Test",
                "Utilisateur",
                "TestPassword123!"
            );
            
            return ResponseEntity.ok(" Email de test envoyé avec succès à: " + testEmail);
        } catch (Exception e) {
            log.error(" Erreur lors du test d'envoi d'email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(" Erreur lors de l'envoi: " + e.getMessage());
        }
    }

    /**
     * POST /api/notifications/send-reset-code
     * Envoie un email avec le code de réinitialisation
     */
    @PostMapping("/send-reset-code")
    public ResponseEntity<Void> sendResetCodeEmail(@RequestBody SendResetCodeRequest request) {
        try {
            log.info(" Reçu demande d'envoi d'email avec code de réinitialisation");
            log.info("   Destinataire: {}", request.getTo());
            log.info("   Code: {}", request.getCode());
            
            emailService.sendResetCodeEmail(
                request.getTo(),
                "",
                "",
                request.getCode()
            );
            
            log.info(" Email avec code de réinitialisation envoyé avec succès à: {}", request.getTo());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error(" ERREUR lors de l'envoi de l'email à {}: {}", request.getTo(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/notifications/send-new-password
     * Envoie un email avec le nouveau mot de passe
     */
    @PostMapping("/send-new-password")
    public ResponseEntity<Void> sendNewPasswordEmail(@RequestBody SendNewPasswordRequest request) {
        try {
            log.info(" Reçu demande d'envoi d'email avec nouveau mot de passe");
            log.info("   Destinataire: {}", request.getTo());
            
            emailService.sendPasswordEmail(
                request.getTo(),
                "",
                "",
                request.getPassword()
            );
            
            log.info(" Email avec nouveau mot de passe envoyé avec succès à: {}", request.getTo());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error(" ERREUR lors de l'envoi de l'email à {}: {}", request.getTo(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/notifications/email/account-blocked
     * Envoie un email de notification de blocage de compte
     */
    @PostMapping("/email/account-blocked")
    public ResponseEntity<Void> sendAccountBlockedEmail(@RequestBody SendAccountBlockedEmailRequest request) {
        try {
            log.info(" Reçu demande d'envoi d'email de blocage de compte");
            log.info("   Destinataire: {}", request.getTo());
            log.info("   Nom: {} {}", request.getFirstName(), request.getLastName());
            
            emailService.sendAccountBlockedEmail(
                request.getTo(),
                request.getFirstName(),
                request.getLastName()
            );
            
            log.info(" Email de blocage de compte envoyé avec succès à: {}", request.getTo());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error(" ERREUR lors de l'envoi de l'email de blocage à {}: {}", request.getTo(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/notifications/email/schedule
     * Envoie une notification de mise à jour d'emploi du temps
     */
    @PostMapping("/email/schedule")
    public ResponseEntity<Void> sendScheduleEmail(@RequestBody com.iusjc.timora.notification.dto.SendScheduleEmailRequest request) {
        try {
            log.info(" Reçu demande d'envoi de notification d'emploi du temps pour: {}", request.getTo());
            emailService.sendScheduleNotification(
                request.getTo(),
                request.getFirstName(),
                request.getLastName(),
                request.getScheduleTitle(),
                request.getAttachmentBase64(),
                request.getAttachmentName()
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error(" ERREUR lors de l'envoi de la notification à {}: {}", request.getTo(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/notifications/health
     * Endpoint de santé pour vérifier que le service fonctionne
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Notification Service is running");
    }
}

