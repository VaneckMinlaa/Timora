package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.Semestre;

import com.iusjc.timora.schedule.entity.UE;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse pour une UE
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UEResponse {

    private String idUE;
    private String codeUE;
    private String nomUE;
    private String description;
    private Integer nombreCredit;
    private Semestre semestre;
    private String filiereId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UEResponse fromEntity(UE ue) {
        return UEResponse.builder()
                .idUE(ue.getIdUE())
                .codeUE(ue.getCodeUE())
                .nomUE(ue.getNomUE())
                .description(ue.getDescription())
                .nombreCredit(ue.getNombreCredit())
                .semestre(ue.getSemestre())
                .filiereId(ue.getFiliereId())
                .createdAt(ue.getCreatedAt())
                .updatedAt(ue.getUpdatedAt())
                .build();
    }
}
