package com.iusjc.timora.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour envoyer un nouveau mot de passe par email
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNewPasswordRequest {
    private String to;
    private String password;
}
