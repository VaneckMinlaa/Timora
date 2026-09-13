package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.Ecole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse pour une école
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EcoleResponse {

    private String idEcole;
    private String nomEcole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Convertit une entité Ecole en EcoleResponse
     */
    public static EcoleResponse fromEntity(Ecole ecole) {
        if (ecole == null) {
            return null;
        }
        return EcoleResponse.builder()
                .idEcole(ecole.getIdEcole())
                .nomEcole(ecole.getNomEcole())
                .createdAt(ecole.getCreatedAt())
                .updatedAt(ecole.getUpdatedAt())
                .build();
    }
}
