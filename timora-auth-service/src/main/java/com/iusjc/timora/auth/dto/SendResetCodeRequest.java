package com.iusjc.timora.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour envoyer un code de réinitialisation par email
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendResetCodeRequest {
    private String to;
    private String code;
}
