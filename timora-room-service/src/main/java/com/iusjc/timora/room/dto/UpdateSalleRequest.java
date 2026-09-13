package com.iusjc.timora.room.dto;

import com.iusjc.timora.room.entity.TypeSalle;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour mettre à jour une salle
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSalleRequest {

    private String nomsalle;
    
    @Positive(message = "La capacité doit être supérieure à 0")
    private Integer capacite;

    private String ecole;

    @Schema(implementation = String.class, allowableValues = {"AMPHI", "TD", "LABORATOIRE", "COURS"})
    private TypeSalle typeSalle;
}
