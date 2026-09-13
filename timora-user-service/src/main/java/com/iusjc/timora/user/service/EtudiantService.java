package com.iusjc.timora.user.service;

import com.iusjc.timora.user.dto.CreateEtudiantRequest;
import com.iusjc.timora.user.dto.EtudiantResponse;
import com.iusjc.timora.user.entity.Etudiant;
import com.iusjc.timora.user.exception.BadRequestException;
import com.iusjc.timora.user.exception.ResourceNotFoundException;
import com.iusjc.timora.user.repository.EtudiantRepository;
import com.iusjc.timora.user.util.ExcelHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des étudiants
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EtudiantService {

    private final EtudiantRepository etudiantRepository;

    @Transactional(readOnly = true)
    public List<EtudiantResponse> getAllEtudiants(String search, String filiereId, String classeId) {
        List<Etudiant> etudiants;

        if (search != null && !search.trim().isEmpty()) {
            etudiants = etudiantRepository.searchEtudiants(search.trim());
        } else if (filiereId != null) {
            etudiants = etudiantRepository.findByFiliereId(filiereId);
        } else if (classeId != null) {
            etudiants = etudiantRepository.findByClasseId(classeId);
        } else {
            etudiants = etudiantRepository.findAll();
        }

        return etudiants.stream()
                .map(EtudiantResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EtudiantResponse getEtudiantById(String id) {
        Etudiant etudiant = etudiantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Étudiant", id));
        return EtudiantResponse.fromEntity(etudiant);
    }

    public EtudiantResponse createEtudiant(CreateEtudiantRequest request) {
        if (etudiantRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Un étudiant avec cet email existe déjà");
        }

        Etudiant etudiant = Etudiant.builder()
                .nom(request.getLastName())
                .prenom(request.getFirstName())
                .email(request.getEmail())
                .telephone(request.getPhone())
                .filiereId(request.getFiliereId())
                .niveau(request.getNiveau())
                .ecoleId(request.getEcoleId())
                .classeId(request.getClasseId())
                .ueIds(request.getUeIds() != null ? new ArrayList<>(request.getUeIds()) : new ArrayList<>())
                .build();

        Etudiant saved = etudiantRepository.save(etudiant);
        log.info("Étudiant créé avec succès - ID: {}, Email: {}", saved.getIdEtudiant(), saved.getEmail());
        return EtudiantResponse.fromEntity(saved);
    }

    public EtudiantResponse updateEtudiant(String id, CreateEtudiantRequest request) {
        Etudiant etudiant = etudiantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Étudiant", id));

        if (request.getEmail() != null && !request.getEmail().equals(etudiant.getEmail())) {
            if (etudiantRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Un étudiant avec cet email existe déjà");
            }
            etudiant.setEmail(request.getEmail());
        }

        if (request.getLastName() != null) etudiant.setNom(request.getLastName());
        if (request.getFirstName() != null) etudiant.setPrenom(request.getFirstName());
        if (request.getPhone() != null) etudiant.setTelephone(request.getPhone());
        if (request.getFiliereId() != null) etudiant.setFiliereId(request.getFiliereId());
        if (request.getNiveau() != null) etudiant.setNiveau(request.getNiveau());
        if (request.getEcoleId() != null) etudiant.setEcoleId(request.getEcoleId());
        if (request.getClasseId() != null) etudiant.setClasseId(request.getClasseId());
        if (request.getUeIds() != null) etudiant.setUeIds(new ArrayList<>(request.getUeIds()));

        Etudiant updated = etudiantRepository.save(etudiant);
        log.info("Étudiant mis à jour avec succès - ID: {}", updated.getIdEtudiant());
        return EtudiantResponse.fromEntity(updated);
    }

    public void deleteEtudiant(String id) {
        if (!etudiantRepository.existsById(id)) {
            throw new ResourceNotFoundException("Étudiant", id);
        }
        etudiantRepository.deleteById(id);
        log.info("Étudiant supprimé avec l'ID: {}", id);
    }

    /**
     * Importer des étudiants depuis un fichier Excel.
     * Colonnes attendues: nom | prénom | email | téléphone | filiereId | niveau | ecoleId | classeId
     */
    public List<EtudiantResponse> importFromExcel(MultipartFile file, String filieresMapJson, String classesMapJson, String ecolesMapJson) {
        if (!ExcelHelper.hasExcelFormat(file)) {
            throw new BadRequestException("Le fichier doit être au format Excel (.xlsx)");
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, String> filieresMap = filieresMapJson != null ? mapper.readValue(filieresMapJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, String>>(){}) : java.util.Collections.emptyMap();
            java.util.Map<String, String> classesMap = classesMapJson != null ? mapper.readValue(classesMapJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, String>>(){}) : java.util.Collections.emptyMap();
            java.util.Map<String, String> ecolesMap = ecolesMapJson != null ? mapper.readValue(ecolesMapJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, String>>(){}) : java.util.Collections.emptyMap();

            List<Etudiant> etudiants = ExcelHelper.excelToEtudiants(file.getInputStream());
            List<Etudiant> saved = new ArrayList<>();
            for (Etudiant e : etudiants) {
                if (e.getEmail() == null || e.getEmail().isBlank()) continue;
                if (etudiantRepository.existsByEmail(e.getEmail())) {
                    log.warn("Email déjà existant, ignoré: {}", e.getEmail());
                    continue;
                }
                
                if (e.getFiliereId() != null && filieresMap.containsKey(e.getFiliereId().toLowerCase())) {
                    e.setFiliereId(filieresMap.get(e.getFiliereId().toLowerCase()));
                }
                if (e.getClasseId() != null && classesMap.containsKey(e.getClasseId().toLowerCase())) {
                    e.setClasseId(classesMap.get(e.getClasseId().toLowerCase()));
                }
                if (e.getEcoleId() != null && ecolesMap.containsKey(e.getEcoleId().toLowerCase())) {
                    e.setEcoleId(ecolesMap.get(e.getEcoleId().toLowerCase()));
                }

                saved.add(etudiantRepository.save(e));
            }
            log.info("{} étudiant(s) importé(s) depuis Excel", saved.size());
            return saved.stream().map(EtudiantResponse::fromEntity).collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier: " + e.getMessage());
        }
    }
}
