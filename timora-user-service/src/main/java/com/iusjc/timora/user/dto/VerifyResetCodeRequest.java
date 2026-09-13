package com.iusjc.timora.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la vérification du code de réinitialisation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyResetCodeRequest {
    
    @NotBlank(message = "L'email est requis")
    @Email(message = "Format d'email invalide")
    private String email;
    
    @NotBlank(message = "Le code de vérification est requis")
    private String code;
}
