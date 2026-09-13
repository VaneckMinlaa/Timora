package com.iusjc.timora.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour l'envoi d'email de notification de blocage de compte
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendAccountBlockedEmailRequest {
    private String to;
    private String firstName;
    private String lastName;
}
