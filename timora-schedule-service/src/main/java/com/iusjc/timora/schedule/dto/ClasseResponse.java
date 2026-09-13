package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.Classe;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse pour une classe
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClasseResponse {

    private String idClasse;
    private String nom;
    private Integer effectif;
    private String filiereId;
    private String ecoleId;
    private String niveau;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ClasseResponse fromEntity(Classe classe) {
        return ClasseResponse.builder()
                .idClasse(classe.getIdClasse())
                .nom(classe.getNom())
                .effectif(classe.getEffectif())
                .filiereId(classe.getFiliereId())
                .ecoleId(classe.getEcoleId())
                .niveau(classe.getNiveau())
                .createdAt(classe.getCreatedAt())
                .updatedAt(classe.getUpdatedAt())
                .build();
    }
}
