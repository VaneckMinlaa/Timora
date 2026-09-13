package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.Semestre;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour créer une nouvelle UE (Unité d'Enseignement)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUERequest {

    @NotBlank(message = "Le code UE est requis")
    private String codeUE;

    @NotBlank(message = "Le nom de l'UE est requis")
    private String nomUE;

    private String description;

    @NotNull(message = "Le nombre de crédits est requis")
    private Integer nombreCredit;

    @NotNull(message = "Le semestre est requis")
    private Semestre semestre;

    @NotBlank(message = "L'ID de la filière est requis")
    private String filiereId;
}
