package com.iusjc.timora.user.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Client pour appeler le service de notification
 */
@Service
@Slf4j
public class NotificationClient {

    private final RestTemplate restTemplate;
    
    @Value("${notification.service.url:http://TIMORA-NOTIFICATION-SERVICE}")
    private String notificationServiceUrl;

    public NotificationClient(@LoadBalanced RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Envoie un email avec le mot de passe à un nouvel utilisateur
     * @param email Email du destinataire
     * @param firstName Prénom de l'utilisateur
     * @param lastName Nom de l'utilisateur
     * @param password Mot de passe généré
     */
    @Async
    public void sendPasswordEmail(String email, String firstName, String lastName, String password) {
        try {
            String url = notificationServiceUrl + "/api/notifications/email/password";
            log.info(" Tentative d'envoi d'email à: {}", email);
            log.debug("URL du service de notification: {}", url);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("to", email);
            requestBody.put("subject", "Bienvenue sur Timora - Vos identifiants de connexion");
            requestBody.put("firstName", firstName);
            requestBody.put("lastName", lastName);
            requestBody.put("password", password);
            
            log.debug("Corps de la requête: to={}, firstName={}, lastName={}", email, firstName, lastName);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            log.debug("Envoi de la requête POST à: {}", url);
            restTemplate.postForObject(url, request, Void.class);
            log.info(" Email avec mot de passe envoyé avec succès à: {}", email);
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.error(" ERREUR: Impossible de se connecter au service de notification à: {}", notificationServiceUrl);
            log.error("   Vérifiez que le service de notification est démarré et accessible");
            log.error("   Détails: {}", e.getMessage());
            // Ne pas faire échouer la création de l'utilisateur si l'email échoue
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error(" ERREUR HTTP {} lors de l'envoi de l'email à {}: {}", e.getStatusCode(), email, e.getMessage());
            log.error("   Réponse: {}", e.getResponseBodyAsString());
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            log.error(" ERREUR SERVEUR {} lors de l'envoi de l'email à {}: {}", e.getStatusCode(), email, e.getMessage());
            log.error("   Réponse: {}", e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(" ERREUR inattendue lors de l'envoi de l'email à {}: {}", email, e.getMessage(), e);
        }
    }

    /**
     * Envoie un email de notification de blocage de compte
     * @param email Email du destinataire
     * @param firstName Prénom de l'utilisateur
     * @param lastName Nom de l'utilisateur
     */
    @Async
    public void sendAccountBlockedEmail(String email, String firstName, String lastName) {
        try {
            String url = notificationServiceUrl + "/api/notifications/email/account-blocked";
            log.info(" Tentative d'envoi d'email de blocage de compte à: {}", email);
            log.debug("URL du service de notification: {}", url);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("to", email);
            requestBody.put("firstName", firstName);
            requestBody.put("lastName", lastName);
            
            log.debug("Corps de la requête: to={}, firstName={}, lastName={}", email, firstName, lastName);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            log.debug("Envoi de la requête POST à: {}", url);
            restTemplate.postForObject(url, request, Void.class);
            log.info(" Email de blocage de compte envoyé avec succès à: {}", email);
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.error(" ERREUR: Impossible de se connecter au service de notification à: {}", notificationServiceUrl);
            log.error("   Vérifiez que le service de notification est démarré et accessible");
            log.error("   Détails: {}", e.getMessage());
            // Ne pas faire échouer la désactivation si l'email échoue
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error(" ERREUR HTTP {} lors de l'envoi de l'email de blocage à {}: {}", e.getStatusCode(), email, e.getMessage());
            log.error("   Réponse: {}", e.getResponseBodyAsString());
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            log.error(" ERREUR SERVEUR {} lors de l'envoi de l'email de blocage à {}: {}", e.getStatusCode(), email, e.getMessage());
            log.error("   Réponse: {}", e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(" ERREUR inattendue lors de l'envoi de l'email de blocage à {}: {}", email, e.getMessage(), e);
            // Ne pas faire échouer la désactivation si l'email échoue
        }
    }

    /**
     * Envoie un email avec le code de réinitialisation
     * @param email Email du destinataire
     * @param firstName Prénom de l'utilisateur
     * @param lastName Nom de l'utilisateur
     * @param code Code de vérification à 6 chiffres
     */
    @Async
    public void sendResetCodeEmail(String email, String firstName, String lastName, String code) {
        try {
            String url = notificationServiceUrl + "/api/notifications/email/reset-code";
            log.info(" Tentative d'envoi d'email de réinitialisation à: {}", email);
            log.debug("URL du service de notification: {}", url);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("to", email);
            requestBody.put("firstName", firstName);
            requestBody.put("lastName", lastName);
            requestBody.put("code", code);
            
            log.debug("Corps de la requête: to={}, firstName={}, lastName={}, code={}", email, firstName, lastName, code);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            log.debug("Envoi de la requête POST à: {}", url);
            restTemplate.postForObject(url, request, Void.class);
            log.info(" Email avec code de réinitialisation envoyé avec succès à: {}", email);
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.error(" ERREUR: Impossible de se connecter au service de notification à: {}", notificationServiceUrl);
            log.error("   Vérifiez que le service de notification est démarré et accessible");
            log.error("   Détails: {}", e.getMessage());
            throw new RuntimeException("Service de notification indisponible");
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error(" ERREUR HTTP {} lors de l'envoi de l'email à {}: {}", e.getStatusCode(), email, e.getMessage());
            log.error("   Réponse: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Erreur lors de l'envoi de l'email");
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            log.error(" ERREUR SERVEUR {} lors de l'envoi de l'email à {}: {}", e.getStatusCode(), email, e.getMessage());
            log.error("   Réponse: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Erreur serveur lors de l'envoi de l'email");
        } catch (Exception e) {
            log.error(" ERREUR inattendue lors de l'envoi de l'email à {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email");
        }
    }
}

