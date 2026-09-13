package com.iusjc.timora.room.dto;

import com.iusjc.timora.room.entity.EtatEquipement;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEquipementRequest {
    @NotBlank(message = "Le nom de l'équipement est obligatoire")
    private String nom;

    @NotBlank(message = "La catégorie de l'équipement est obligatoire")
    @Schema(description = "Catégorie de l'équipement (ex: Projecteur, Ordinateur, etc.)", defaultValue = "Autre")
    private String categorie;

    @NotNull(message = "Le statut de l'équipement est obligatoire")
    @Schema(implementation = String.class, allowableValues = {"DISPONIBLE", "DEFECTUEUX", "EN_COUR_D_UTILISATION", "EN_MAINTENANCE"})
    private EtatEquipement statut;

    @Schema(description = "ID de la salle où se trouve l'équipement (optionnel)")
    private String salleId;
}
