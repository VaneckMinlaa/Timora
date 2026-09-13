package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.Semestre;
import com.iusjc.timora.schedule.entity.TypeCours;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de réponse pour un cours
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoursResponse {

    private String idCours;
    private String nom;
    @Schema(implementation = String.class, allowableValues = {"COURS_MAGISTRAL", "TD", "TP", "EXAMEN"})
    private TypeCours type;
    private Semestre semestre;
    private String enseignantId;
    private String salleId;
    private String emploiDuTempsId;
    private List<String> ueIds;
    private List<String> classeIds;
    private String filiereId;  
    private String filiereNom;  
    private String niveau;  
    private Integer credits;
    private Integer volumeTotal;
    private Integer volumeRestant;
    
    private String jourSemaine;
    private java.time.LocalTime heureDebut;
    private java.time.LocalTime heureFin;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
