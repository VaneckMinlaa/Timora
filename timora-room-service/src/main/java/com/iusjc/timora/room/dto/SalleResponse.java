package com.iusjc.timora.room.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.iusjc.timora.room.entity.TypeSalle;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse d'une salle
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalleResponse {

    private String idSalle;
    private String nomsalle;
    private Integer capacite;
    private String ecole;
    @Schema(implementation = String.class, allowableValues = {"AMPHI", "TD", "LABORATOIRE", "COURS"})
    private TypeSalle typeSalle;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
