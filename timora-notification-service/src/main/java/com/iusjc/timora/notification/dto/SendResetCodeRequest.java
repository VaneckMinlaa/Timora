package com.iusjc.timora.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour l'envoi du code de réinitialisation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendResetCodeRequest {
    private String to;
    private String code;
}
