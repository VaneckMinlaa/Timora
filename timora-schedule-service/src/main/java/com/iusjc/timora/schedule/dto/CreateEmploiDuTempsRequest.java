package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.StatutEmp;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEmploiDuTempsRequest {
    private String titre;
    private String ecoleNom;
    private String filiereNom;
    private String classeNom;
    private String semestre;
    private String classeId;
    private String enseignantId;
    private Integer semaine;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private StatutEmp statut;
    private List<String> coursIds;
}
