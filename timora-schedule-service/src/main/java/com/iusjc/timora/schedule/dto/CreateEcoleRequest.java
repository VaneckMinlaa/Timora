package com.iusjc.timora.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour créer une nouvelle école
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEcoleRequest {

    @NotBlank(message = "Le nom de l'école est requis")
    private String nomEcole;
}
