package com.iusjc.timora.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour créer une nouvelle filière
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFiliereRequest {

    @NotBlank(message = "Le nom de la filière est requis")
    private String nom;

    private String description;

    private String ecoleId; 
}
