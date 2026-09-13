package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.entity.*;
import com.iusjc.timora.schedule.repository.ConflictResolutionRepository;
import com.iusjc.timora.schedule.repository.CoursRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de génération de solutions pour les conflits
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConflictResolutionService {

    private final CoursRepository coursRepository;
    private final ConflictResolutionRepository resolutionRepository;

    /**
     * Génère des solutions pour un conflit donné
     */
    @Transactional
    public List<ConflictResolution> generateResolutions(Conflict conflict) {
        log.info("Génération de solutions pour le conflit {}", conflict.getId());
        
        List<ConflictResolution> resolutions = new ArrayList<>();
        
        switch (conflict.getType()) {
            case TEACHER_OVERLAP:
                resolutions.addAll(resolveTeacherConflict(conflict));
                break;
            case ROOM_OVERLAP:
                resolutions.addAll(resolveRoomConflict(conflict));
                break;
            case STUDENT_GROUP_OVERLAP:
                resolutions.addAll(resolveStudentGroupConflict(conflict));
                break;
            case TIME_OVERFLOW:
                resolutions.addAll(resolveTimeOverflowConflict(conflict));
                break;
            default:
                log.warn("Type de conflit non géré : {}", conflict.getType());
        }
        
        // Sauvegarder les résolutions
        List<ConflictResolution> savedResolutions = resolutionRepository.saveAll(resolutions);
        log.info("{} solutions générées pour le conflit {}", savedResolutions.size(), conflict.getId());
        
        return savedResolutions;
    }

    /**
     * Résout un conflit d'enseignant
     */
    private List<ConflictResolution> resolveTeacherConflict(Conflict conflict) {
        List<ConflictResolution> resolutions = new ArrayList<>();
        List<Cours> affectedCours = getAffectedCours(conflict);
        
        if (affectedCours.isEmpty()) {
            return resolutions;
        }

        // Solution 1 : Déplacer un cours vers un autre créneau
        for (int i = 0; i < affectedCours.size(); i++) {
            Cours cours = affectedCours.get(i);
            List<String> availableSlots = findAvailableTimeSlots(cours);
            
            for (int j = 0; j < Math.min(2, availableSlots.size()); j++) {
                String slot = availableSlots.get(j);
                Map<String, String> changes = new HashMap<>();
                changes.put("coursId", cours.getIdCours());
                changes.put("newTimeSlot", slot);
                changes.put("action", "CHANGE_TIME");
                
                ConflictResolution resolution = ConflictResolution.builder()
                    .conflictId(conflict.getId())
                    .type(ResolutionType.CHANGE_TIME)
                    .description("Déplacer vers " + slot)
                    .explanation(String.format("Déplacer le cours '%s' vers %s", cours.getNom(), slot))
                    .priority(90 - (i * 10) - (j * 5))
                    .feasibility(ResolutionFeasibility.HIGH)
                    .impact("Impact minimal - Seul ce cours est déplacé")
                    .changes(changes)
                    .build();
                
                resolutions.add(resolution);
            }
        }

        // Solution 2 : Échanger deux cours
        if (affectedCours.size() >= 2) {
            Cours cours1 = affectedCours.get(0);
            Cours cours2 = affectedCours.get(1);
            
            Map<String, String> changes = new HashMap<>();
            changes.put("cours1Id", cours1.getIdCours());
            changes.put("cours2Id", cours2.getIdCours());
            changes.put("action", "SWAP");
            
            ConflictResolution resolution = ConflictResolution.builder()
                .conflictId(conflict.getId())
                .type(ResolutionType.SWAP_COURSES)
                .description("Échanger les créneaux")
                .explanation(String.format("Échanger les créneaux de '%s' et '%s'", cours1.getNom(), cours2.getNom()))
                .priority(75)
                .feasibility(ResolutionFeasibility.MEDIUM)
                .impact("Impact moyen - Deux cours sont affectés")
                .changes(changes)
                .build();
            
            resolutions.add(resolution);
        }
        
        return resolutions;
    }

    /**
     * Résout un conflit de salle
     */
    private List<ConflictResolution> resolveRoomConflict(Conflict conflict) {
        List<ConflictResolution> resolutions = new ArrayList<>();
        List<Cours> affectedCours = getAffectedCours(conflict);
        
        if (affectedCours.isEmpty()) {
            return resolutions;
        }

        // Solution 1 : Changer de salle pour un des cours
        String[] availableRooms = {"S101", "S102", "S103", "S201", "S202", "S301", "AMPHI-A", "AMPHI-B"};
        
        for (int i = 0; i < affectedCours.size(); i++) {
            Cours cours = affectedCours.get(i);
            
            for (int j = 0; j < Math.min(3, availableRooms.length); j++) {
                String newRoom = availableRooms[j];
                
                // Vérifier que ce n'est pas la salle actuelle
                if (newRoom.equals(cours.getSalleId())) {
                    continue;
                }
                
                Map<String, String> changes = new HashMap<>();
                changes.put("coursId", cours.getIdCours());
                changes.put("newRoomId", newRoom);
                changes.put("oldRoomId", cours.getSalleId());
                changes.put("action", "CHANGE_ROOM");
                
                ConflictResolution resolution = ConflictResolution.builder()
                    .conflictId(conflict.getId())
                    .type(ResolutionType.CHANGE_ROOM)
                    .description("Déplacer vers salle " + newRoom)
                    .explanation(String.format("Déplacer '%s' en salle %s au même horaire", cours.getNom(), newRoom))
                    .priority(95 - (i * 10) - (j * 5))
                    .feasibility(ResolutionFeasibility.HIGH)
                    .impact("Impact minimal - Seule la salle change")
                    .changes(changes)
                    .build();
                
                resolutions.add(resolution);
            }
        }

        // Solution 2 : Déplacer vers un autre créneau
        for (int i = 0; i < Math.min(2, affectedCours.size()); i++) {
            Cours cours = affectedCours.get(i);
            List<String> availableSlots = findAvailableTimeSlots(cours);
            
            if (!availableSlots.isEmpty()) {
                String slot = availableSlots.get(0);
                Map<String, String> changes = new HashMap<>();
                changes.put("coursId", cours.getIdCours());
                changes.put("newTimeSlot", slot);
                changes.put("action", "CHANGE_TIME");
                
                ConflictResolution resolution = ConflictResolution.builder()
                    .conflictId(conflict.getId())
                    .type(ResolutionType.CHANGE_TIME)
                    .description("Déplacer vers " + slot)
                    .explanation(String.format("Déplacer '%s' vers %s dans la même salle", cours.getNom(), slot))
                    .priority(70 - (i * 10))
                    .feasibility(ResolutionFeasibility.MEDIUM)
                    .impact("Impact moyen - L'horaire change")
                    .changes(changes)
                    .build();
                
                resolutions.add(resolution);
            }
        }
        
        return resolutions;
    }

    /**
     * Résout un conflit de groupe d'étudiants
     */
    private List<ConflictResolution> resolveStudentGroupConflict(Conflict conflict) {
        List<ConflictResolution> resolutions = new ArrayList<>();
        List<Cours> affectedCours = getAffectedCours(conflict);
        
        if (affectedCours.size() < 2) {
            return resolutions;
        }

        // Solution 1 : Déplacer un des cours vers un autre créneau
        for (int i = 0; i < affectedCours.size(); i++) {
            Cours cours = affectedCours.get(i);
            List<String> availableSlots = findAvailableTimeSlots(cours);
            
            if (!availableSlots.isEmpty()) {
                String slot = availableSlots.get(0);
                Map<String, String> changes = new HashMap<>();
                changes.put("coursId", cours.getIdCours());
                changes.put("newTimeSlot", slot);
                changes.put("action", "CHANGE_TIME");
                
                ConflictResolution resolution = ConflictResolution.builder()
                    .conflictId(conflict.getId())
                    .type(ResolutionType.CHANGE_TIME)
                    .description("Déplacer vers " + slot)
                    .explanation(String.format("Déplacer '%s' vers %s", cours.getNom(), slot))
                    .priority(85 - (i * 10))
                    .feasibility(ResolutionFeasibility.HIGH)
                    .impact("Impact minimal pour les étudiants")
                    .changes(changes)
                    .build();
                
                resolutions.add(resolution);
            }
        }

        // Solution 2 : Diviser le groupe
        Cours cours = affectedCours.get(0);
        Map<String, String> changes = new HashMap<>();
        changes.put("coursId", cours.getIdCours());
        changes.put("action", "SPLIT_GROUP");
        
        ConflictResolution resolution = ConflictResolution.builder()
            .conflictId(conflict.getId())
            .type(ResolutionType.SPLIT_GROUP)
            .description("Diviser le groupe")
            .explanation("Créer deux groupes pour ce cours")
            .priority(60)
            .feasibility(ResolutionFeasibility.LOW)
            .impact("Impact important - Nécessite des ressources supplémentaires")
            .changes(changes)
            .build();
        
        resolutions.add(resolution);
        
        return resolutions;
    }

    /**
     * Résout un conflit de dépassement d'horaire
     */
    private List<ConflictResolution> resolveTimeOverflowConflict(Conflict conflict) {
        List<ConflictResolution> resolutions = new ArrayList<>();
        List<Cours> affectedCours = getAffectedCours(conflict);
        
        if (affectedCours.isEmpty()) {
            return resolutions;
        }

        Cours cours = affectedCours.get(0);
        
        // Solution : Déplacer vers un créneau valide
        List<String> validSlots = Arrays.asList(
            "Lundi 08:00-10:00",
            "Lundi 10:00-12:00",
            "Lundi 14:00-16:00",
            "Mardi 08:00-10:00",
            "Mardi 10:00-12:00"
        );
        
        for (int i = 0; i < Math.min(3, validSlots.size()); i++) {
            String slot = validSlots.get(i);
            Map<String, String> changes = new HashMap<>();
            changes.put("coursId", cours.getIdCours());
            changes.put("newTimeSlot", slot);
            changes.put("action", "CHANGE_TIME");
            
            ConflictResolution resolution = ConflictResolution.builder()
                .conflictId(conflict.getId())
                .type(ResolutionType.CHANGE_TIME)
                .description("Déplacer vers " + slot)
                .explanation(String.format("Déplacer '%s' vers un créneau valide : %s", cours.getNom(), slot))
                .priority(90 - (i * 10))
                .feasibility(ResolutionFeasibility.HIGH)
                .impact("Impact minimal")
                .changes(changes)
                .build();
            
            resolutions.add(resolution);
        }
        
        return resolutions;
    }

    /**
     * Récupère les cours affectés par un conflit
     */
    private List<Cours> getAffectedCours(Conflict conflict) {
        if (conflict.getAffectedCoursIds() == null || conflict.getAffectedCoursIds().isEmpty()) {
            return Collections.emptyList();
        }
        
        return conflict.getAffectedCoursIds().stream()
            .map(coursRepository::findById)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toList());
    }

    /**
     * Trouve des créneaux horaires disponibles pour un cours
     */
    private List<String> findAvailableTimeSlots(Cours cours) {
        // Créneaux possibles
        List<String> allSlots = Arrays.asList(
            "Lundi 08:00-10:00",
            "Lundi 10:00-12:00",
            "Lundi 14:00-16:00",
            "Lundi 16:00-18:00",
            "Mardi 08:00-10:00",
            "Mardi 10:00-12:00",
            "Mardi 14:00-16:00",
            "Mardi 16:00-18:00",
            "Mercredi 08:00-10:00",
            "Mercredi 10:00-12:00",
            "Mercredi 14:00-16:00",
            "Jeudi 08:00-10:00",
            "Jeudi 10:00-12:00",
            "Jeudi 14:00-16:00",
            "Jeudi 16:00-18:00",
            "Vendredi 08:00-10:00",
            "Vendredi 10:00-12:00",
            "Vendredi 14:00-16:00"
        );
        
        // Pour simplifier, retourner quelques créneaux aléatoires
        // Dans une vraie implémentation, il faudrait vérifier la disponibilité réelle
        Collections.shuffle(allSlots);
        return allSlots.subList(0, Math.min(5, allSlots.size()));
    }
}
