package com.iusjc.timora.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    
    @NotBlank(message = "Le code est requis")
    @Pattern(regexp = "^[0-9]{6}$", message = "Le code doit contenir 6 chiffres")
    private String code;
}
