package com.iusjc.timora.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour l'envoi du nouveau mot de passe
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendNewPasswordRequest {
    private String to;
    private String password;
}
