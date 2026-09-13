package com.iusjc.timora.room.dto;

import com.iusjc.timora.room.entity.EtatEquipement;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipementResponse {
    private String idEquip;
    private String nom;
    private String categorie;
    @Schema(implementation = String.class, allowableValues = {"DISPONIBLE", "DEFECTUEUX", "EN_COUR_D_UTILISATION", "EN_MAINTENANCE"})
    private EtatEquipement statut;
    private String salleId;
    private String salleNom; 
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
