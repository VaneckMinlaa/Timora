package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.dto.ClasseResponse;
import com.iusjc.timora.schedule.dto.CreateClasseRequest;
import com.iusjc.timora.schedule.dto.CreateFiliereRequest;
import com.iusjc.timora.schedule.dto.FiliereResponse;
import com.iusjc.timora.schedule.dto.UEResponse;
import com.iusjc.timora.schedule.entity.Classe;
import com.iusjc.timora.schedule.entity.Filiere;
import com.iusjc.timora.schedule.repository.ClasseRepository;
import com.iusjc.timora.schedule.repository.EcoleRepository;
import com.iusjc.timora.schedule.repository.FiliereRepository;
import com.iusjc.timora.schedule.repository.UERepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des filières
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FiliereService {

    private final FiliereRepository filiereRepository;
    private final ClasseRepository classeRepository;
    private final UERepository ueRepository;
    private final EcoleRepository ecoleRepository;

    /**
     * Récupère toutes les filières
     */
    @Transactional(readOnly = true)
    public List<FiliereResponse> getAllFilieres() {
        return filiereRepository.findAll().stream()
                .map(FiliereResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère une filière par ID
     */
    @Transactional(readOnly = true)
    public FiliereResponse getFiliereById(String id) {
        Filiere filiere = filiereRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filière introuvable: " + id));
        return FiliereResponse.fromEntity(filiere);
    }

    /**
     * Récupère toutes les classes d'une filière
     */
    @Transactional(readOnly = true)
    public List<ClasseResponse> getClassesByFiliere(String filiereId) {
        return classeRepository.findByFiliereId(filiereId).stream()
                .map(ClasseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère toutes les classes (toutes filières confondues)
     */
    @Transactional(readOnly = true)
    public List<ClasseResponse> getAllClasses() {
        return classeRepository.findAll().stream()
                .map(ClasseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère toutes les UEs d'une filière
     */
    @Transactional(readOnly = true)
    public List<UEResponse> getUEsByFiliere(String filiereId) {
        return ueRepository.findByFiliereId(filiereId).stream()
                .map(UEResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Crée une nouvelle filière
     */
    public FiliereResponse createFiliere(CreateFiliereRequest request) {
        // Valider que l'école existe
        String ecoleId = request.getEcoleId();
        if (ecoleId == null || ecoleId.isEmpty()) {
            throw new RuntimeException("L'ID de l'école est requis pour créer une filière");
        }
        
        if (!ecoleRepository.existsById(ecoleId)) {
            throw new RuntimeException("L'école avec l'ID '" + ecoleId + "' n'existe pas");
        }

        Filiere filiere = Filiere.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .ecoleId(ecoleId)
                .build();

        filiere = filiereRepository.save(filiere);
        log.info("Filière créée avec succès: {} pour l'école: {}", filiere.getIdFiliere(), ecoleId);
        return FiliereResponse.fromEntity(filiere);
    }

    /**
     * Supprime une filière
     */
    public void deleteFiliere(String id) {
        if (!filiereRepository.existsById(id)) {
            throw new RuntimeException("Filière introuvable: " + id);
        }
        filiereRepository.deleteById(id);
        log.info("Filière supprimée: {}", id);
    }

    /**
     * Met à jour une filière
     */
    public FiliereResponse updateFiliere(String id, CreateFiliereRequest request) {
        Filiere filiere = filiereRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filière introuvable: " + id));

        String ecoleId = request.getEcoleId();
        if (ecoleId == null || ecoleId.isEmpty()) {
            throw new RuntimeException("L'ID de l'école est requis pour mettre à jour une filière");
        }
        
        if (!ecoleRepository.existsById(ecoleId)) {
            throw new RuntimeException("L'école avec l'ID '" + ecoleId + "' n'existe pas");
        }

        filiere.setNom(request.getNom());
        filiere.setDescription(request.getDescription());
        filiere.setEcoleId(ecoleId);

        filiere = filiereRepository.save(filiere);
        log.info("Filière mise à jour avec succès: {} pour l'école: {}", filiere.getIdFiliere(), ecoleId);
        return FiliereResponse.fromEntity(filiere);
    }

    /**
     * Crée une nouvelle classe
     */
    public ClasseResponse createClasse(CreateClasseRequest request) {
        // Valider que la filière existe
        String filiereId = request.getFiliereId();
        if (filiereId == null || filiereId.isEmpty()) {
            throw new RuntimeException("L'ID de la filière est requis pour créer une classe");
        }
        
        if (!filiereRepository.existsById(filiereId)) {
            throw new RuntimeException("La filière avec l'ID '" + filiereId + "' n'existe pas");
        }

        // Valider que l'école existe
        String ecoleId = request.getEcoleId();
        if (ecoleId == null || ecoleId.isEmpty()) {
            throw new RuntimeException("L'ID de l'école est requis pour créer une classe");
        }
        
        if (!ecoleRepository.existsById(ecoleId)) {
            throw new RuntimeException("L'école avec l'ID '" + ecoleId + "' n'existe pas");
        }

        Classe classe = Classe.builder()
                .nom(request.getNom())
                .effectif(request.getEffectif())
                .filiereId(filiereId)
                .ecoleId(ecoleId)
                .niveau(request.getNiveau())
                .build();

        classe = classeRepository.save(classe);
        log.info("Classe créée avec succès: {} pour la filière: {} et l'école: {}", 
                classe.getIdClasse(), filiereId, ecoleId);
        return ClasseResponse.fromEntity(classe);
    }

    /**
     * Met à jour une classe
     */
    public ClasseResponse updateClasse(String id, CreateClasseRequest request) {
        Classe classe = classeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Classe introuvable: " + id));

        // Valider que la filière existe
        String filiereId = request.getFiliereId();
        if (filiereId == null || filiereId.isEmpty()) {
            throw new RuntimeException("L'ID de la filière est requis pour mettre à jour une classe");
        }
        
        if (!filiereRepository.existsById(filiereId)) {
            throw new RuntimeException("La filière avec l'ID '" + filiereId + "' n'existe pas");
        }

        // Valider que l'école existe
        String ecoleId = request.getEcoleId();
        if (ecoleId == null || ecoleId.isEmpty()) {
            throw new RuntimeException("L'ID de l'école est requis pour mettre à jour une classe");
        }
        
        if (!ecoleRepository.existsById(ecoleId)) {
            throw new RuntimeException("L'école avec l'ID '" + ecoleId + "' n'existe pas");
        }

        classe.setNom(request.getNom());
        classe.setEffectif(request.getEffectif());
        classe.setFiliereId(filiereId);
        classe.setEcoleId(ecoleId);
        classe.setNiveau(request.getNiveau());

        classe = classeRepository.save(classe);
        log.info("Classe mise à jour avec succès: {} pour la filière: {} et l'école: {}", 
                classe.getIdClasse(), filiereId, ecoleId);
        return ClasseResponse.fromEntity(classe);
    }

    /**
     * Supprime une classe
     */
    public void deleteClasse(String id) {
        if (!classeRepository.existsById(id)) {
            throw new RuntimeException("Classe introuvable: " + id);
        }
        classeRepository.deleteById(id);
        log.info("Classe supprimée: {}", id);
    }
}
