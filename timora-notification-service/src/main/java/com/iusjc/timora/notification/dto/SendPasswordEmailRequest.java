package com.iusjc.timora.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la requête d'envoi d'email avec mot de passe
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendPasswordEmailRequest {
    private String to;
    private String subject;
    private String firstName;
    private String lastName;
    private String password;
}

