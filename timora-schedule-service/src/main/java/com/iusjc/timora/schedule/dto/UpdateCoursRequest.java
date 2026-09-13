package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.TypeCours;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO pour la mise à jour d'un cours
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCoursRequest {

    private String nom;
    @Schema(implementation = String.class, allowableValues = {"COURS_MAGISTRAL", "TD", "TP", "EXAMEN"})
    private TypeCours type;
    private String enseignantId;
    private String salleId;
    private List<String> ueIds;
    private List<String> classeIds;
    private Integer credits;
 
    private String jourSemaine;
 
    @Schema(type = "string", example = "08:00:00")
    private java.time.LocalTime heureDebut;
 
    @Schema(type = "string", example = "10:00:00")
    private java.time.LocalTime heureFin;
    
    private Integer volumeTotal;
    private Integer volumeRestant;
}
