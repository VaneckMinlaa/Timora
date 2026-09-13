package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.Filiere;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse pour une filière
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FiliereResponse {

    private String idFiliere;
    private String nom;
    private String description;
    private String ecoleId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FiliereResponse fromEntity(Filiere filiere) {
        return FiliereResponse.builder()
                .idFiliere(filiere.getIdFiliere())
                .nom(filiere.getNom())
                .description(filiere.getDescription())
                .ecoleId(filiere.getEcoleId())
                .createdAt(filiere.getCreatedAt())
                .updatedAt(filiere.getUpdatedAt())
                .build();
    }
}
