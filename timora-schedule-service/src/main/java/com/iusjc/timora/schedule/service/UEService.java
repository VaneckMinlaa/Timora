package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.dto.CreateUERequest;
import com.iusjc.timora.schedule.dto.UEResponse;
import com.iusjc.timora.schedule.entity.UE;
import com.iusjc.timora.schedule.repository.FiliereRepository;
import com.iusjc.timora.schedule.repository.UERepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des UEs
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UEService {

    private final UERepository ueRepository;
    private final FiliereRepository filiereRepository;

    /**
     * Récupère toutes les UEs
     */
    @Transactional(readOnly = true)
    public List<UEResponse> getAllUEs() {
        return ueRepository.findAll().stream()
                .map(UEResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère une UE par ID
     */
    @Transactional(readOnly = true)
    public UEResponse getUEById(String id) {
        if (id == null) {
            throw new IllegalArgumentException("L'ID de l'UE ne peut pas être nul");
        }
        UE ue = ueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("UE introuvable: " + id));
        return UEResponse.fromEntity(ue);
    }

    /**
     * Récupère une UE par code
     */
    @Transactional(readOnly = true)
    public UEResponse getUEByCode(String codeUE) {
        UE ue = ueRepository.findByCodeUE(codeUE)
                .orElseThrow(() -> new RuntimeException("UE introuvable avec le code: " + codeUE));
        return UEResponse.fromEntity(ue);
    }

    /**
     * Crée une nouvelle UE
     */
    public UEResponse createUE(CreateUERequest request) {
        if (request == null || request.getFiliereId() == null) {
            throw new IllegalArgumentException("La requête ou l'ID de la filière ne peut pas être nul");
        }
        // Vérifier que la filière existe
        if (!filiereRepository.existsById(request.getFiliereId())) {
            throw new RuntimeException("Filière introuvable: " + request.getFiliereId());
        }

        UE ue = UE.builder()
                .codeUE(request.getCodeUE())
                .nomUE(request.getNomUE())
                .description(request.getDescription())
                .nombreCredit(request.getNombreCredit())
                .semestre(request.getSemestre())
                .filiereId(request.getFiliereId())
                .build();

        ue = ueRepository.save(ue);
        log.info("UE créée avec succès: {} - {}", ue.getCodeUE(), ue.getIdUE());
        return UEResponse.fromEntity(ue);
    }

    /**
     * Supprime une UE
     */
    @SuppressWarnings("null")
    public void deleteUE(String id) {
        if (id == null) {
            throw new IllegalArgumentException("L'ID de l'UE ne peut pas être nul");
        }
        if (!ueRepository.existsById(id)) {
            throw new RuntimeException("UE introuvable: " + id);
        }
        ueRepository.deleteById(id);
        log.info("UE supprimée: {}", id);
    }

    /**
     * Met à jour une UE
     */
    public UEResponse updateUE(String id, CreateUERequest request) {
        UE ue = ueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("UE introuvable: " + id));

        // Vérifier que la filière existe
        if (!filiereRepository.existsById(request.getFiliereId())) {
            throw new RuntimeException("Filière introuvable: " + request.getFiliereId());
        }

        // Vérifier unicité du code UE si le code a changé
        if (!ue.getCodeUE().equals(request.getCodeUE())) {
            ueRepository.findByCodeUE(request.getCodeUE())
                    .ifPresent(existingUE -> {
                        throw new RuntimeException("Une autre UE possède déjà le code: " + request.getCodeUE());
                    });
        }

        ue.setCodeUE(request.getCodeUE());
        ue.setNomUE(request.getNomUE());
        ue.setDescription(request.getDescription());
        ue.setNombreCredit(request.getNombreCredit());
        ue.setSemestre(request.getSemestre());
        ue.setFiliereId(request.getFiliereId());

        ue = ueRepository.save(ue);
        log.info("UE mise à jour avec succès: {} - {}", ue.getCodeUE(), ue.getIdUE());
        return UEResponse.fromEntity(ue);
    }
}
