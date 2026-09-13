package com.iusjc.timora.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour l'envoi d'email avec code de réinitialisation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendResetCodeEmailRequest {
    private String to;
    private String firstName;
    private String lastName;
    private String code;
}
