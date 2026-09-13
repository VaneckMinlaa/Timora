package com.iusjc.timora.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ByteArrayResource;

/**
 * Service pour l'envoi d'emails
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${notification.email.from:noreply@timora.com}")
    private String defaultFromEmail;

    /**
     * Envoie un email avec le mot de passe à un nouvel utilisateur
     * @param to Email du destinataire
     * @param firstName Prénom de l'utilisateur
     * @param lastName Nom de l'utilisateur
     * @param password Mot de passe généré
     */
    @Async
    public void sendPasswordEmail(String to, String firstName, String lastName, String password) {
        try {
            log.info(" Début de l'envoi d'email à: {}", to);
            log.debug("   Prénom: {}, Nom: {}", firstName, lastName);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            String from = (fromEmail != null && !fromEmail.isEmpty()) ? fromEmail : defaultFromEmail;
            log.debug("   Email expéditeur: {}", from);
            
            if (from != null) {
                helper.setFrom(from);
            }
            helper.setTo(to != null ? to : "");
            helper.setSubject("Bienvenue sur Timora - Vos identifiants de connexion");
            
            log.debug("   Construction du corps HTML de l'email...");
            String emailBody = buildPasswordEmailBodyHtml(
                firstName != null ? firstName : "",
                lastName != null ? lastName : "",
                to != null ? to : "",
                password != null ? password : ""
            );
            if (emailBody != null) {
                helper.setText(emailBody, true); 
            }
            
            log.debug("   Envoi de l'email via SMTP...");
            mailSender.send(message);
            log.info(" Email avec mot de passe envoyé avec succès à: {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage(), e);
        }
    }

    /**
     * Envoie un email avec le code de réinitialisation
     */
    @Async
    public void sendResetCodeEmail(String to, String firstName, String lastName, String code) {
        try {
            log.info(" Début de l'envoi d'email de réinitialisation à: {}", to);
            log.debug("   Prénom: {}, Nom: {}, Code: {}", firstName, lastName, code);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            String from = (fromEmail != null && !fromEmail.isEmpty()) ? fromEmail : defaultFromEmail;
            log.debug("   Email expéditeur: {}", from);
            
            if (from != null) {
                helper.setFrom(from);
            }
            helper.setTo(to != null ? to : "");
            helper.setSubject("Timora - Code de réinitialisation de mot de passe");
            
            log.debug("   Construction du corps HTML de l'email...");
            String emailBody = buildResetCodeEmailBodyHtml(
                firstName != null ? firstName : "",
                lastName != null ? lastName : "",
                code != null ? code : ""
            );
            if (emailBody != null) {
                helper.setText(emailBody, true); 
            }
            
            log.debug("   Envoi de l'email via SMTP...");
            mailSender.send(message);
            log.info(" Email avec code de réinitialisation envoyé avec succès à: {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage(), e);
        }
    }

    /**
     * Envoie un email de notification de blocage de compte
     * @param to Email du destinataire
     * @param firstName Prénom de l'utilisateur
     * @param lastName Nom de l'utilisateur
     */
    @Async
    public void sendAccountBlockedEmail(String to, String firstName, String lastName) {
        try {
            log.info(" Début de l'envoi d'email de blocage de compte à: {}", to);
            log.debug("   Prénom: {}, Nom: {}", firstName, lastName);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            String from = (fromEmail != null && !fromEmail.isEmpty()) ? fromEmail : defaultFromEmail;
            log.debug("   Email expéditeur: {}", from);
            
            if (from != null) {
                helper.setFrom(from);
            }
            helper.setTo(to != null ? to : "");
            helper.setSubject("Timora - Notification de blocage de compte");
            
            log.debug("   Construction du corps HTML de l'email...");
            String emailBody = buildAccountBlockedEmailBodyHtml(
                firstName != null ? firstName : "",
                lastName != null ? lastName : ""
            );
            if (emailBody != null) {
                helper.setText(emailBody, true); // true = HTML
            }
            
            log.debug("   Envoi de l'email via SMTP...");
            mailSender.send(message);
            log.info(" Email de blocage de compte envoyé avec succès à: {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email de blocage à {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de blocage à {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage(), e);
        }
    }

    /**
     * Envoie une notification d'emploi du temps mis à jour avec optionnellement le PDF en pièce jointe
     */
    @Async
    public void sendScheduleNotification(String to, String firstName, String lastName, String scheduleTitle, String attachmentBase64, String attachmentName) {
        try {
            log.info(" Début de l'envoi de notification d'emploi du temps à: {}", to);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            String from = (fromEmail != null && !fromEmail.isEmpty()) ? fromEmail : defaultFromEmail;
            if (from != null) helper.setFrom(from);
            
            helper.setTo(to);
            helper.setSubject("Timora - Votre emploi du temps a été mis à jour");
            
            String emailBody = buildScheduleEmailBodyHtml(firstName, lastName, scheduleTitle);
            helper.setText(emailBody, true);
            
            // Ajout de la pièce jointe si présente
            if (attachmentBase64 != null && !attachmentBase64.isEmpty()) {
                log.info("   Ajout de la pièce jointe: {}", attachmentName);
                byte[] content = java.util.Base64.getDecoder().decode(attachmentBase64);
                helper.addAttachment(attachmentName != null ? attachmentName : "emploi_du_temps.pdf", new ByteArrayResource(content));
            }
            
            mailSender.send(message);
            log.info(" Notification d'emploi du temps envoyée avec succès à: {}", to);
        } catch (Exception e) {
            log.error("Erreur l'envoi de notification d'emploi du temps à {}: {}", to, e.getMessage());
        }
    }

    private String buildScheduleEmailBodyHtml(String firstName, String lastName, String scheduleTitle) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mise à jour de l'emploi du temps</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f1f5f9;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; margin: 40px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" style="max-width: 600px; width: 100%%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); overflow: hidden; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 40px 32px;">
                                        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                                            Bonjour <strong style="color: #0f172a;">%s %s</strong>,
                                        </p>
                                        
                                        <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin-bottom: 24px;">
                                            <p style="margin: 0; color: #0369a1; font-size: 15px; line-height: 1.5;">
                                                Un nouvel emploi du temps vous concernant a été publié ou mis à jour :
                                            </p>
                                            <p style="margin: 8px 0 0 0; color: #0c4a6e; font-size: 17px; font-weight: 700;">
                                                %s
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                            Nous vous invitons à consulter votre espace personnel sur la plateforme <strong>Timora</strong> pour visualiser les détails de vos créneaux et salles assignées.
                                        </p>
                                        
                                        <div style="text-align: center; margin: 32px 0;">
                                            <a href="http://localhost:4200/login" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
                                                Accéder à Timora
                                            </a>
                                        </div>
                                        
                                        <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                            Cordialement,<br>
                                            <strong style="color: #0f172a;">L'administration Timora</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(firstName, lastName, scheduleTitle);
    }

    /**
     * Construit le corps de l'email HTML pour la notification de blocage de compte
     */
    private String buildAccountBlockedEmailBodyHtml(String firstName, String lastName) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Notification de blocage de compte</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; margin: 40px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" style="max-width: 600px; width: 100%%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); overflow: hidden; border-collapse: collapse;">
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 32px;">
                                        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                                            Bonjour <strong style="color: #0f172a; font-weight: 700;">%s %s</strong>,
                                        </p>
                                        
                                        <!-- Warning Box -->
                                        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                                            <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 700;">
                                                Accès suspendu
                                            </p>
                                            <p style="margin: 0; color: #7f1d1d; font-size: 15px; line-height: 1.5;">
                                                Votre compte utilisateur sur la plateforme Timora a été temporairement désactivé par un administrateur.
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                            Pour des raisons de sécurité ou de politique interne, l'accès à vos services a été restreint. Vous ne pourrez plus vous connecter à l'application jusqu'à nouvel ordre.
                                        </p>
                                        
                                        <!-- Information Box -->
                                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 0 0 32px 0;">
                                            <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">
                                                <strong style="color: #0f172a;">Que faire maintenant ?</strong><br><br>
                                                Si vous estimez qu'il s'agit d'une erreur ou si vous souhaitez en savoir plus sur les motifs de cette suspension, nous vous invitons à prendre contact avec le département informatique ou l'administration locale de votre établissement.
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                            Cordialement,<br>
                                            <strong style="color: #0f172a;">L'équipe Timora</strong>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; font-weight: 600;">
                                            Timora - Votre plateforme de gestion
                                        </p>
                                        <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                                            Cet email a été généré automatiquement. Merci de ne pas y répondre.
                                            <br><br>
                                            © 2026 Timora. Tous droits réservés.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(firstName, lastName);
    }

    /**
     * Construit le corps de l'email HTML pour le code de réinitialisation
     */
    private String buildResetCodeEmailBodyHtml(String firstName, String lastName, String code) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Réinitialisation de mot de passe</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; margin: 40px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" style="max-width: 600px; width: 100%%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); overflow: hidden; border-collapse: collapse;">
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 32px;">
                                        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                                            Bonjour <strong style="color: #0f172a; font-weight: 700;">%s %s</strong>,
                                        </p>
                                        
                                        <p style="margin: 0 0 32px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                            Nous avons reçu une demande de réinitialisation de votre mot de passe. Veuillez utiliser le code de sécurité ci-dessous pour finaliser la procédure.
                                        </p>
                                        
                                        <!-- Code -->
                                        <div style="text-align: center; margin: 0 0 32px 0;">
                                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; display: inline-block; min-width: 60%%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                                                <div style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
                                                    Code de vérification
                                                </div>
                                                <div style="color: #2563eb; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; text-align: center; padding-left: 12px;">
                                                    %s
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Security Notice -->
                                        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 0 0 32px 0;">
                                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                                <strong style="color: #78350f;">Important :</strong> Pour des raisons de sécurité, ce code expirera automatiquement dans 15 minutes.
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel reste actif et inchangé.
                                        </p>
                                        
                                        <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                            Cordialement,<br>
                                            <strong style="color: #0f172a;">L'équipe Timora</strong>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; font-weight: 600;">
                                            Timora - Votre plateforme de gestion
                                        </p>
                                        <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                                            Cet email a été généré automatiquement. Merci de ne pas y répondre.
                                            <br><br>
                                            © 2026 Timora. Tous droits réservés.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(firstName, lastName, code);
    }

    /**
     * Construit le corps de l'email HTML avec le mot de passe
     */
    private String buildPasswordEmailBodyHtml(String firstName, String lastName, String email, String password) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bienvenue sur Timora</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; margin: 40px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" style="max-width: 600px; width: 100%%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); overflow: hidden; border-collapse: collapse;">
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 32px;">
                                        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                                            Bonjour <strong style="color: #0f172a; font-weight: 700;">%s %s</strong>,
                                        </p>
                                        
                                        <p style="margin: 0 0 32px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                            Votre compte a été créé avec succès sur Timora. Vous trouverez ci-dessous vos identifiants sécurisés pour accéder à la plateforme.
                                        </p>
                                        
                                        <!-- Credentials -->
                                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 0 0 32px 0;">
                                            <div style="margin-bottom: 24px;">
                                                <div style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                                                    Identifiant (Email)
                                                </div>
                                                <div style="color: #0f172a; font-size: 15px; font-family: 'SFMono-Regular', Consolas, Menlo, Courier, monospace; background: #ffffff; padding: 12px 16px; border-radius: 6px; border: 1px solid #cbd5e1; word-break: break-all;">
                                                    %s
                                                </div>
                                            </div>
                                            <div>
                                                <div style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                                                    Mot de passe temporaire
                                                </div>
                                                <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; font-family: 'SFMono-Regular', Consolas, Menlo, Courier, monospace;">
                                                    <span style="color: #2563eb; font-size: 16px; font-weight: 700; letter-spacing: 1.5px;">
                                                        %s
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Security Notice -->
                                        <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px 20px; margin: 0 0 32px 0;">
                                            <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                                                <strong style="color: #14532d;">Action requise :</strong> Pour garantir la sécurité maximale de vos informations, veuillez changer votre mot de passe dès votre première connexion.
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                            Nous vous souhaitons une excellente expérience,<br>
                                            <strong style="color: #0f172a;">L'équipe Timora</strong>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; font-weight: 600;">
                                            Timora - Votre plateforme de gestion
                                        </p>
                                        <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                                            Cet email a été généré automatiquement. Merci de ne pas y répondre.
                                            <br><br>
                                            © 2026 Timora. Tous droits réservés.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(firstName, lastName, email, password);
    }
}

