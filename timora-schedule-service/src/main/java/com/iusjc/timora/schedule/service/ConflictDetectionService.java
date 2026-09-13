package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.entity.*;
import com.iusjc.timora.schedule.repository.ClasseRepository;
import com.iusjc.timora.schedule.repository.ConflictRepository;
import com.iusjc.timora.schedule.repository.CoursRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de détection des conflits d'horaires
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConflictDetectionService {

    private final CoursRepository coursRepository;
    private final ClasseRepository classeRepository;
    private final ConflictRepository conflictRepository;

    /**
     * Détecte tous les conflits dans les emplois du temps
     */
    @Transactional
    public List<Conflict> detectAllConflicts() {
        log.info("Début de la détection des conflits");
        
        List<Cours> allCours = coursRepository.findAll();
        List<Conflict> conflicts = new ArrayList<>();

        // Détecter les différents types de conflits
        conflicts.addAll(detectTeacherConflicts(allCours));
        conflicts.addAll(detectRoomConflicts(allCours));
        conflicts.addAll(detectStudentGroupConflicts(allCours));
        conflicts.addAll(detectRoomCapacityConflicts(allCours));
        conflicts.addAll(detectTimeOverflowConflicts(allCours));

        // Sauvegarder les nouveaux conflits
        List<Conflict> savedConflicts = conflictRepository.saveAll(conflicts);
        
        log.info("Détection terminée : {} conflits détectés", savedConflicts.size());
        return savedConflicts;
    }

    /**
     * Détecte les conflits d'enseignants (même enseignant, même créneau)
     */
    private List<Conflict> detectTeacherConflicts(List<Cours> allCours) {
        List<Conflict> conflicts = new ArrayList<>();
        
        // Grouper par enseignant, jour et créneau horaire
        Map<String, List<Cours>> byTeacherAndTime = allCours.stream()
            .filter(c -> c.getEnseignantId() != null && c.getJourSemaine() != null 
                      && c.getHeureDebut() != null && c.getHeureFin() != null)
            .collect(Collectors.groupingBy(c -> 
                c.getEnseignantId() + "_" + c.getJourSemaine() + "_" + c.getHeureDebut()
            ));

        // Détecter les chevauchements
        for (Map.Entry<String, List<Cours>> entry : byTeacherAndTime.entrySet()) {
            List<Cours> coursList = entry.getValue();
            
            if (coursList.size() > 1) {
                // Conflit détecté
                Cours firstCours = coursList.get(0);
                
                Conflict conflict = Conflict.builder()
                    .type(ConflictType.TEACHER_OVERLAP)
                    .severity(ConflictSeverity.CRITICAL)
                    .status(ConflictStatus.PENDING)
                    .title("Conflit d'enseignant")
                    .description(String.format("L'enseignant est programmé pour %d cours simultanément", coursList.size()))
                    .teacherId(firstCours.getEnseignantId())
                    .teacherName("Enseignant " + firstCours.getEnseignantId().substring(0, Math.min(8, firstCours.getEnseignantId().length())))
                    .dayOfWeek(firstCours.getJourSemaine())
                    .startTime(firstCours.getHeureDebut())
                    .endTime(firstCours.getHeureFin())
                    .affectedCoursIds(coursList.stream().map(Cours::getIdCours).collect(Collectors.toList()))
                    .build();
                
                conflicts.add(conflict);
            }
        }
        
        log.info("Conflits d'enseignants détectés : {}", conflicts.size());
        return conflicts;
    }

    /**
     * Détecte les conflits de salles (même salle, même créneau)
     */
    private List<Conflict> detectRoomConflicts(List<Cours> allCours) {
        List<Conflict> conflicts = new ArrayList<>();
        
        // Grouper par salle, jour et créneau horaire
        Map<String, List<Cours>> byRoomAndTime = allCours.stream()
            .filter(c -> c.getSalleId() != null && c.getJourSemaine() != null 
                      && c.getHeureDebut() != null && c.getHeureFin() != null)
            .collect(Collectors.groupingBy(c -> 
                c.getSalleId() + "_" + c.getJourSemaine() + "_" + c.getHeureDebut()
            ));

        // Détecter les chevauchements
        for (Map.Entry<String, List<Cours>> entry : byRoomAndTime.entrySet()) {
            List<Cours> coursList = entry.getValue();
            
            if (coursList.size() > 1) {
                // Conflit détecté
                Cours firstCours = coursList.get(0);
                
                Conflict conflict = Conflict.builder()
                    .type(ConflictType.ROOM_OVERLAP)
                    .severity(ConflictSeverity.CRITICAL)
                    .status(ConflictStatus.PENDING)
                    .title("Conflit de salle")
                    .description(String.format("La salle est occupée par %d cours simultanément", coursList.size()))
                    .roomId(firstCours.getSalleId())
                    .roomName("Salle " + firstCours.getSalleId().substring(0, Math.min(8, firstCours.getSalleId().length())))
                    .dayOfWeek(firstCours.getJourSemaine())
                    .startTime(firstCours.getHeureDebut())
                    .endTime(firstCours.getHeureFin())
                    .affectedCoursIds(coursList.stream().map(Cours::getIdCours).collect(Collectors.toList()))
                    .build();
                
                conflicts.add(conflict);
            }
        }
        
        log.info("Conflits de salles détectés : {}", conflicts.size());
        return conflicts;
    }

    /**
     * Détecte les conflits de groupes d'étudiants (même classe, même créneau)
     */
    private List<Conflict> detectStudentGroupConflicts(List<Cours> allCours) {
        List<Conflict> conflicts = new ArrayList<>();
        
        // Pour chaque cours, vérifier si les classes ont d'autres cours au même moment
        Map<String, List<Cours>> byDayAndTime = allCours.stream()
            .filter(c -> c.getJourSemaine() != null && c.getHeureDebut() != null 
                      && c.getHeureFin() != null && !c.getClasseIds().isEmpty())
            .collect(Collectors.groupingBy(c -> 
                c.getJourSemaine() + "_" + c.getHeureDebut()
            ));

        for (Map.Entry<String, List<Cours>> entry : byDayAndTime.entrySet()) {
            List<Cours> coursList = entry.getValue();
            
            // Vérifier les classes en commun
            for (int i = 0; i < coursList.size(); i++) {
                for (int j = i + 1; j < coursList.size(); j++) {
                    Cours cours1 = coursList.get(i);
                    Cours cours2 = coursList.get(j);
                    
                    // Trouver les classes en commun
                    Set<String> commonClasses = new HashSet<>(cours1.getClasseIds());
                    commonClasses.retainAll(cours2.getClasseIds());
                    
                    if (!commonClasses.isEmpty()) {
                        // Conflit détecté
                        String classeId = commonClasses.iterator().next();
                        
                        Conflict conflict = Conflict.builder()
                            .type(ConflictType.STUDENT_GROUP_OVERLAP)
                            .severity(ConflictSeverity.HIGH)
                            .status(ConflictStatus.PENDING)
                            .title("Conflit de groupe d'étudiants")
                            .description("Un groupe d'étudiants a plusieurs cours simultanément")
                            .classeId(classeId)
                            .className("Classe " + classeId.substring(0, Math.min(8, classeId.length())))
                            .dayOfWeek(cours1.getJourSemaine())
                            .startTime(cours1.getHeureDebut())
                            .endTime(cours1.getHeureFin())
                            .affectedCoursIds(Arrays.asList(cours1.getIdCours(), cours2.getIdCours()))
                            .build();
                        
                        conflicts.add(conflict);
                    }
                }
            }
        }
        
        log.info("Conflits de groupes d'étudiants détectés : {}", conflicts.size());
        return conflicts;
    }

    /**
     * Détecte les conflits de capacité de salle
     */
    private List<Conflict> detectRoomCapacityConflicts(List<Cours> allCours) {
        List<Conflict> conflicts = new ArrayList<>();
        
        // Pour chaque cours, vérifier si la capacité de la salle est suffisante
        for (Cours cours : allCours) {
            if (cours.getClasseIds() == null || cours.getClasseIds().isEmpty()) {
                continue;
            }
            
            // Calculer l'effectif total
            int totalEffectif = 0;
            for (String classeId : cours.getClasseIds()) {
                classeRepository.findById(classeId).ifPresent(classe -> {
                    // totalEffectif += classe.getEffectif();
                });
            }
            
            // Note: Pour l'instant, on ne peut pas vérifier la capacité réelle de la salle
            // car elle n'est pas accessible depuis ce service. À implémenter avec un client Feign.
        }
        
        log.info("Conflits de capacité détectés : {}", conflicts.size());
        return conflicts;
    }

    /**
     * Détecte les cours qui dépassent les horaires autorisés
     */
    private List<Conflict> detectTimeOverflowConflicts(List<Cours> allCours) {
        List<Conflict> conflicts = new ArrayList<>();
        
        LocalTime maxEndTime = LocalTime.of(20, 0); // 20h00
        LocalTime minStartTime = LocalTime.of(7, 0); // 07h00
        
        for (Cours cours : allCours) {
            if (cours.getHeureDebut() == null || cours.getHeureFin() == null) {
                continue;
            }
            
            if (cours.getHeureDebut().isBefore(minStartTime) || cours.getHeureFin().isAfter(maxEndTime)) {
                Conflict conflict = Conflict.builder()
                    .type(ConflictType.TIME_OVERFLOW)
                    .severity(ConflictSeverity.MEDIUM)
                    .status(ConflictStatus.PENDING)
                    .title("Dépassement d'horaire")
                    .description("Le cours dépasse les horaires autorisés (07h-20h)")
                    .dayOfWeek(cours.getJourSemaine())
                    .startTime(cours.getHeureDebut())
                    .endTime(cours.getHeureFin())
                    .affectedCoursIds(Collections.singletonList(cours.getIdCours()))
                    .build();
                
                conflicts.add(conflict);
            }
        }
        
        log.info("Conflits de dépassement d'horaire détectés : {}", conflicts.size());
        return conflicts;
    }
}
