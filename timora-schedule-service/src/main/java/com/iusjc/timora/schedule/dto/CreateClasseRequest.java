package com.iusjc.timora.schedule.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la création d'une classe
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateClasseRequest {

    @NotBlank(message = "Le nom de la classe est requis")
    private String nom;

    @NotNull(message = "L'effectif est requis")
    @Min(value = 1, message = "L'effectif doit être au moins 1")
    private Integer effectif;

    // filiereId est optionnel dans le body car il vient du path variable
    // Il sera défini par le contrôleur avant la validation
    private String filiereId;

    @NotBlank(message = "L'ID de l'école est requis")
    private String ecoleId;

    @NotBlank(message = "Le niveau est requis")
    private String niveau;
}
