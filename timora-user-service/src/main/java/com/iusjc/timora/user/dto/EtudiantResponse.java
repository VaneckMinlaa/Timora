package com.iusjc.timora.user.dto;

import com.iusjc.timora.user.entity.Etudiant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO de réponse pour un étudiant
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtudiantResponse {

    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String filiereId;
    private String niveau;
    private String ecoleId;
    private String classeId;
    private List<String> ueIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EtudiantResponse fromEntity(Etudiant etudiant) {
        return EtudiantResponse.builder()
                .id(etudiant.getIdEtudiant())
                .email(etudiant.getEmail())
                .firstName(etudiant.getPrenom())
                .lastName(etudiant.getNom())
                .phone(etudiant.getTelephone())
                .filiereId(etudiant.getFiliereId())
                .niveau(etudiant.getNiveau())
                .ecoleId(etudiant.getEcoleId())
                .classeId(etudiant.getClasseId())
                .ueIds(etudiant.getUeIds() != null ? new ArrayList<>(etudiant.getUeIds()) : new ArrayList<>())
                .createdAt(etudiant.getCreatedAt())
                .updatedAt(etudiant.getUpdatedAt())
                .build();
    }
}
