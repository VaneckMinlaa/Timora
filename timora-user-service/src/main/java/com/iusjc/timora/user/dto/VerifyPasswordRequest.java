package com.iusjc.timora.user.dto;

import jakarta.validation.constraints.NotBlank;
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
    
    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
}

