package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.Semestre;
import com.iusjc.timora.schedule.entity.TypeCours;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO pour la création d'un cours
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCoursRequest {

    @NotBlank(message = "Le nom du cours est obligatoire")
    private String nom;

    @NotNull(message = "Le type de cours est obligatoire")
    @Schema(implementation = String.class, allowableValues = {"COURS_MAGISTRAL", "TD", "TP", "EXAMEN"})
    private TypeCours type;

    @NotNull(message = "Le semestre est obligatoire")
    private Semestre semestre;

    @NotBlank(message = "L'ID de l'enseignant est obligatoire")
    private String enseignantId;

    private String salleId; // Optionnel, peut être assigné automatiquement selon le type

    // IDs des UEs concernées
    @Builder.Default
    private List<String> ueIds = new ArrayList<>();

    // IDs des classes 
    @Builder.Default
    private List<String> classeIds = new ArrayList<>();

    // Pour l'assignation automatique de classes
    private String filiereId; 
    private String niveau; 
    private String ecoleId;

    // Horaires du cours
    private String jourSemaine;
    private LocalTime heureDebut;
    private LocalTime heureFin;

    // Pour les cours récurrents
    private LocalDate dateDebut;
    private LocalDate dateFin; 
    private Boolean estRecurrent; 
    private Integer nombreOccurrences; 

    // Pour les cours spéciaux 
    private Boolean estSpecial; 
    private String description;
    
    private Integer credits;
    
    private Integer volumeTotal;
    private Integer volumeRestant;
}
