package com.iusjc.timora.room.dto;

import com.iusjc.timora.room.entity.TypeSalle;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour créer une salle
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSalleRequest {

    @NotBlank(message = "Le nom de la salle est obligatoire")
    private String nomsalle;

    @NotNull(message = "La capacité est obligatoire")
    @Positive(message = "La capacité doit être supérieure à 0")
    private Integer capacite;

    private String ecole;

    @NotNull(message = "Le type de salle est obligatoire")
    @Schema(implementation = String.class, allowableValues = {"AMPHI", "TD", "LABORATOIRE", "COURS"})
    private TypeSalle typeSalle;
}
