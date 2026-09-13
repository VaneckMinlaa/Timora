package com.iusjc.timora.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la vérification du mot de passe
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyPasswordRequest {
    private String password;
}

