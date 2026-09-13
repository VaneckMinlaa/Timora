package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.dto.*;
import com.iusjc.timora.schedule.entity.*;
import com.iusjc.timora.schedule.repository.ClasseRepository;
import com.iusjc.timora.schedule.repository.ConflictRepository;
import com.iusjc.timora.schedule.repository.ConflictResolutionRepository;
import com.iusjc.timora.schedule.repository.CoursRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service principal de gestion des conflits
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConflictService {

    private final ConflictRepository conflictRepository;
    private final ConflictResolutionRepository resolutionRepository;
    private final CoursRepository coursRepository;
    private final ClasseRepository classeRepository;
    private final ConflictDetectionService detectionService;
    private final ConflictResolutionService resolutionService;

    /**
     * Récupère tous les conflits avec filtres optionnels
     */
    public List<ConflictResponse> getAllConflicts(ConflictStatus status, ConflictType type) {
        List<Conflict> conflicts;
        
        if (status != null && type != null) {
            conflicts = conflictRepository.findByStatusAndType(status, type);
        } else if (status != null) {
            conflicts = conflictRepository.findByStatus(status);
        } else if (type != null) {
            conflicts = conflictRepository.findByType(type);
        } else {
            conflicts = conflictRepository.findAll();
        }
        
        return conflicts.stream()
            .map(this::toConflictResponse)
            .collect(Collectors.toList());
    }

    /**
     * Récupère les détails d'un conflit avec ses solutions
     */
    public ConflictDetailsResponse getConflictDetails(String conflictId) {
        Conflict conflict = conflictRepository.findById(conflictId)
            .orElseThrow(() -> new RuntimeException("Conflit non trouvé : " + conflictId));
        
        // Récupérer les cours affectés
        List<AffectedCourseResponse> affectedCourses = conflict.getAffectedCoursIds().stream()
            .map(coursId -> coursRepository.findById(coursId))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(this::toAffectedCourseResponse)
            .collect(Collectors.toList());
        
        // Récupérer ou générer les solutions
        List<ConflictResolution> resolutions = resolutionRepository.findByConflictIdOrderByPriorityDesc(conflictId);
        
        if (resolutions.isEmpty()) {
            // Générer les solutions si elles n'existent pas encore
            resolutions = resolutionService.generateResolutions(conflict);
        }
        
        List<ResolutionResponse> resolutionResponses = resolutions.stream()
            .map(this::toResolutionResponse)
            .collect(Collectors.toList());
        
        return ConflictDetailsResponse.builder()
            .conflict(toConflictResponse(conflict))
            .affectedCourses(affectedCourses)
            .suggestedSolutions(resolutionResponses)
            .build();
    }

    /**
     * Détecte tous les conflits
     */
    @Transactional
    public List<ConflictResponse> detectConflicts() {
        // Marquer les anciens conflits pending comme résolus automatiquement
        List<Conflict> oldPendingConflicts = conflictRepository.findByStatus(ConflictStatus.PENDING);
        oldPendingConflicts.forEach(c -> {
            c.setStatus(ConflictStatus.RESOLVED);
            c.setResolvedAt(LocalDateTime.now());
            c.setResolutionNotes("Résolu automatiquement lors d'une nouvelle détection");
        });
        conflictRepository.saveAll(oldPendingConflicts);
        
        // Détecter les nouveaux conflits
        List<Conflict> newConflicts = detectionService.detectAllConflicts();
        
        return newConflicts.stream()
            .map(this::toConflictResponse)
            .collect(Collectors.toList());
    }

    /**
     * Résout un conflit en appliquant une solution
     */
    @Transactional
    public void resolveConflict(String conflictId, ResolveConflictRequest request) {
        Conflict conflict = conflictRepository.findById(conflictId)
            .orElseThrow(() -> new RuntimeException("Conflit non trouvé : " + conflictId));
        
        ConflictResolution resolution = resolutionRepository.findById(request.getResolutionId())
            .orElseThrow(() -> new RuntimeException("Solution non trouvée : " + request.getResolutionId()));
        
        // Appliquer la solution
        applyResolution(conflict, resolution);
        
        // Marquer le conflit comme résolu
        conflict.setStatus(ConflictStatus.RESOLVED);
        conflict.setResolvedAt(LocalDateTime.now());
        conflict.setResolvedBy(request.getResolvedBy());
        conflict.setResolutionNotes(request.getNotes());
        
        conflictRepository.save(conflict);
        
        log.info("Conflit {} résolu avec la solution {}", conflictId, request.getResolutionId());
    }

    /**
     * Ignore un conflit
     */
    @Transactional
    public void ignoreConflict(String conflictId, String reason) {
        Conflict conflict = conflictRepository.findById(conflictId)
            .orElseThrow(() -> new RuntimeException("Conflit non trouvé : " + conflictId));
        
        conflict.setStatus(ConflictStatus.IGNORED);
        conflict.setResolvedAt(LocalDateTime.now());
        conflict.setResolutionNotes("Ignoré : " + reason);
        
        conflictRepository.save(conflict);
        
        log.info("Conflit {} ignoré", conflictId);
    }

    /**
     * Résout automatiquement tous les conflits en attente
     */
    @Transactional
    public Map<String, Integer> autoResolveAllConflicts() {
        List<Conflict> pendingConflicts = conflictRepository.findByStatus(ConflictStatus.PENDING);
        
        int resolved = 0;
        int failed = 0;
        
        for (Conflict conflict : pendingConflicts) {
            try {
                // Récupérer la meilleure solution
                List<ConflictResolution> resolutions = resolutionRepository.findByConflictIdOrderByPriorityDesc(conflict.getId());
                
                if (resolutions.isEmpty()) {
                    resolutions = resolutionService.generateResolutions(conflict);
                }
                
                if (!resolutions.isEmpty()) {
                    ConflictResolution bestResolution = resolutions.get(0);
                    
                    // Appliquer la solution
                    applyResolution(conflict, bestResolution);
                    
                    // Marquer comme résolu
                    conflict.setStatus(ConflictStatus.RESOLVED);
                    conflict.setResolvedAt(LocalDateTime.now());
                    conflict.setResolvedBy("AUTO");
                    conflict.setResolutionNotes("Résolu automatiquement");
                    
                    conflictRepository.save(conflict);
                    resolved++;
                } else {
                    failed++;
                }
            } catch (Exception e) {
                log.error("Erreur lors de la résolution automatique du conflit {}", conflict.getId(), e);
                failed++;
            }
        }
        
        Map<String, Integer> result = new HashMap<>();
        result.put("resolved", resolved);
        result.put("failed", failed);
        
        log.info("Résolution automatique terminée : {} résolus, {} échoués", resolved, failed);
        return result;
    }

    /**
     * Récupère les statistiques des conflits
     */
    public ConflictStatsResponse getConflictStats() {
        List<Conflict> allConflicts = conflictRepository.findAll();
        
        long total = allConflicts.size();
        long pending = allConflicts.stream().filter(c -> c.getStatus() == ConflictStatus.PENDING).count();
        long resolved = allConflicts.stream().filter(c -> c.getStatus() == ConflictStatus.RESOLVED).count();
        long ignored = allConflicts.stream().filter(c -> c.getStatus() == ConflictStatus.IGNORED).count();
        
        // Conflits de cette semaine
        LocalDateTime weekStart = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS).minusDays(7);
        List<Conflict> thisWeekConflicts = conflictRepository.findByDetectedAtBetween(weekStart, LocalDateTime.now());
        long detectedThisWeek = thisWeekConflicts.size();
        long resolvedThisWeek = thisWeekConflicts.stream()
            .filter(c -> c.getStatus() == ConflictStatus.RESOLVED)
            .count();
        
        // Par type
        Map<String, Long> byType = allConflicts.stream()
            .collect(Collectors.groupingBy(c -> c.getType().name(), Collectors.counting()));
        
        // Par sévérité
        Map<String, Long> bySeverity = allConflicts.stream()
            .collect(Collectors.groupingBy(c -> c.getSeverity().name(), Collectors.counting()));
        
        return ConflictStatsResponse.builder()
            .totalConflicts(total)
            .pendingConflicts(pending)
            .resolvedConflicts(resolved)
            .ignoredConflicts(ignored)
            .detectedThisWeek(detectedThisWeek)
            .resolvedThisWeek(resolvedThisWeek)
            .conflictsByType(byType)
            .conflictsBySeverity(bySeverity)
            .build();
    }

    /**
     * Applique une résolution à un conflit
     */
    private void applyResolution(Conflict conflict, ConflictResolution resolution) {
        Map<String, String> changes = resolution.getChanges();
        String action = changes.get("action");
        
        if (action == null) {
            log.warn("Aucune action définie dans la résolution {}", resolution.getId());
            return;
        }
        
        switch (action) {
            case "CHANGE_ROOM":
                applyRoomChange(changes);
                break;
            case "CHANGE_TIME":
                applyTimeChange(changes);
                break;
            case "SWAP":
                applySwap(changes);
                break;
            default:
                log.warn("Action non gérée : {}", action);
        }
    }

    private void applyRoomChange(Map<String, String> changes) {
        String coursId = changes.get("coursId");
        String newRoomId = changes.get("newRoomId");
        
        coursRepository.findById(coursId).ifPresent(cours -> {
            cours.setSalleId(newRoomId);
            coursRepository.save(cours);
            log.info("Salle changée pour le cours {} : {}", coursId, newRoomId);
        });
    }

    private void applyTimeChange(Map<String, String> changes) {
        String coursId = changes.get("coursId");
        String newTimeSlot = changes.get("newTimeSlot");
        
        // Parser le créneau (ex: "Lundi 08:00-10:00")
        String[] parts = newTimeSlot.split(" ");
        if (parts.length == 2) {
            String day = parts[0];
            String[] times = parts[1].split("-");
            
            if (times.length == 2) {
                coursRepository.findById(coursId).ifPresent(cours -> {
                    cours.setJourSemaine(day);
                    cours.setHeureDebut(java.time.LocalTime.parse(times[0]));
                    cours.setHeureFin(java.time.LocalTime.parse(times[1]));
                    coursRepository.save(cours);
                    log.info("Horaire changé pour le cours {} : {}", coursId, newTimeSlot);
                });
            }
        }
    }

    private void applySwap(Map<String, String> changes) {
        String cours1Id = changes.get("cours1Id");
        String cours2Id = changes.get("cours2Id");
        
        Optional<Cours> cours1Opt = coursRepository.findById(cours1Id);
        Optional<Cours> cours2Opt = coursRepository.findById(cours2Id);
        
        if (cours1Opt.isPresent() && cours2Opt.isPresent()) {
            Cours cours1 = cours1Opt.get();
            Cours cours2 = cours2Opt.get();
            
            // Échanger les horaires
            String tempDay = cours1.getJourSemaine();
            java.time.LocalTime tempStart = cours1.getHeureDebut();
            java.time.LocalTime tempEnd = cours1.getHeureFin();
            
            cours1.setJourSemaine(cours2.getJourSemaine());
            cours1.setHeureDebut(cours2.getHeureDebut());
            cours1.setHeureFin(cours2.getHeureFin());
            
            cours2.setJourSemaine(tempDay);
            cours2.setHeureDebut(tempStart);
            cours2.setHeureFin(tempEnd);
            
            coursRepository.save(cours1);
            coursRepository.save(cours2);
            
            log.info("Cours échangés : {} <-> {}", cours1Id, cours2Id);
        }
    }

    // Méthodes de conversion

    private ConflictResponse toConflictResponse(Conflict conflict) {
        return ConflictResponse.builder()
            .id(conflict.getId())
            .type(conflict.getType())
            .severity(conflict.getSeverity())
            .status(conflict.getStatus())
            .title(conflict.getTitle())
            .description(conflict.getDescription())
            .affectedCoursIds(conflict.getAffectedCoursIds())
            .roomId(conflict.getRoomId())
            .roomName(conflict.getRoomName())
            .teacherId(conflict.getTeacherId())
            .teacherName(conflict.getTeacherName())
            .classeId(conflict.getClasseId())
            .className(conflict.getClassName())
            .dayOfWeek(conflict.getDayOfWeek())
            .startTime(conflict.getStartTime())
            .endTime(conflict.getEndTime())
            .conflictDate(conflict.getConflictDate())
            .detectedAt(conflict.getDetectedAt())
            .resolvedAt(conflict.getResolvedAt())
            .resolvedBy(conflict.getResolvedBy())
            .updatedAt(conflict.getUpdatedAt())
            .build();
    }

    private AffectedCourseResponse toAffectedCourseResponse(Cours cours) {
        // Récupérer les noms des classes
        List<String> classNames = cours.getClasseIds().stream()
            .map(classeId -> classeRepository.findById(classeId))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(Classe::getNom)
            .collect(Collectors.toList());
        
        return AffectedCourseResponse.builder()
            .id(cours.getIdCours())
            .name(cours.getNom())
            .type(cours.getType())
            .teacherId(cours.getEnseignantId())
            .teacherName("Enseignant " + (cours.getEnseignantId() != null ? cours.getEnseignantId().substring(0, Math.min(8, cours.getEnseignantId().length())) : ""))
            .roomId(cours.getSalleId())
            .roomName("Salle " + (cours.getSalleId() != null ? cours.getSalleId().substring(0, Math.min(8, cours.getSalleId().length())) : ""))
            .startTime(cours.getHeureDebut())
            .endTime(cours.getHeureFin())
            .classNames(classNames)
            .dayOfWeek(cours.getJourSemaine())
            .build();
    }

    private ResolutionResponse toResolutionResponse(ConflictResolution resolution) {
        return ResolutionResponse.builder()
            .id(resolution.getId())
            .type(resolution.getType())
            .description(resolution.getDescription())
            .explanation(resolution.getExplanation())
            .priority(resolution.getPriority())
            .feasibility(resolution.getFeasibility())
            .impact(resolution.getImpact())
            .changes(resolution.getChanges())
            .build();
    }
}
