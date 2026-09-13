package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.dto.CreateEcoleRequest;
import com.iusjc.timora.schedule.dto.EcoleResponse;
import com.iusjc.timora.schedule.entity.Ecole;
import com.iusjc.timora.schedule.repository.ClasseRepository;
import com.iusjc.timora.schedule.repository.EcoleRepository;
import com.iusjc.timora.schedule.repository.FiliereRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des écoles
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EcoleService {

    private final EcoleRepository ecoleRepository;
    private final FiliereRepository filiereRepository;
    private final ClasseRepository classeRepository;

    /**
     * Récupère toutes les écoles
     */
    @Transactional(readOnly = true)
    public List<EcoleResponse> getAllEcoles() {
        return ecoleRepository.findAll().stream()
                .map(EcoleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Récupère une école par ID
     */
    @Transactional(readOnly = true)
    public EcoleResponse getEcoleById(String id) {
        Ecole ecole = ecoleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("École introuvable: " + id));
        return EcoleResponse.fromEntity(ecole);
    }

    /**
     * Crée une nouvelle école
     */
    public EcoleResponse createEcole(CreateEcoleRequest request) {
        // Vérifier si une école avec le même nom existe déjà
        if (ecoleRepository.existsByNomEcole(request.getNomEcole())) {
            throw new RuntimeException("Une école avec le nom '" + request.getNomEcole() + "' existe déjà");
        }

        Ecole ecole = Ecole.builder()
                .nomEcole(request.getNomEcole())
                .build();

        ecole = ecoleRepository.save(ecole);
        log.info("École créée avec succès: {}", ecole.getIdEcole());
        return EcoleResponse.fromEntity(ecole);
    }

    /**
     * Met à jour une école
     */
    public EcoleResponse updateEcole(String id, CreateEcoleRequest request) {
        Ecole ecole = ecoleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("École introuvable: " + id));

        // Vérifier si une autre école avec le même nom existe déjà
        ecoleRepository.findByNomEcole(request.getNomEcole())
                .ifPresent(existingEcole -> {
                    if (!existingEcole.getIdEcole().equals(id)) {
                        throw new RuntimeException("Une autre école avec le nom '" + request.getNomEcole() + "' existe déjà");
                    }
                });

        ecole.setNomEcole(request.getNomEcole());
        ecole = ecoleRepository.save(ecole);
        log.info("École mise à jour avec succès: {}", ecole.getIdEcole());
        return EcoleResponse.fromEntity(ecole);
    }

    /**
     * Supprime une école
     * Vérifie qu'aucune filière ou classe n'est associée à cette école
     */
    public void deleteEcole(String id) {
        if (!ecoleRepository.existsById(id)) {
            throw new RuntimeException("École introuvable: " + id);
        }

        // Vérifier si des filières sont associées à cette école
        long filiereCount = filiereRepository.findAll().stream()
                .filter(f -> id.equals(f.getEcoleId()))
                .count();
        
        if (filiereCount > 0) {
            throw new RuntimeException("Impossible de supprimer l'école. " + filiereCount + " filière(s) y sont associée(s). Supprimez d'abord les filières.");
        }

        // Vérifier si des classes sont associées à cette école
        long classeCount = classeRepository.findAll().stream()
                .filter(c -> id.equals(c.getEcoleId()))
                .count();
        
        if (classeCount > 0) {
            throw new RuntimeException("Impossible de supprimer l'école. " + classeCount + " classe(s) y sont associée(s). Supprimez d'abord les classes.");
        }

        ecoleRepository.deleteById(id);
        log.info("École supprimée: {}", id);
    }
}
