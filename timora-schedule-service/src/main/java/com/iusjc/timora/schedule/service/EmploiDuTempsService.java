package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.client.NotificationServiceClient;
import com.iusjc.timora.schedule.client.UserServiceClient;
import com.iusjc.timora.schedule.entity.Cours;
import com.iusjc.timora.schedule.entity.EmploiDuTemps;
import com.iusjc.timora.schedule.repository.CoursRepository;
import com.iusjc.timora.schedule.repository.EmploiDuTempsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import com.iusjc.timora.schedule.entity.StatutEmp;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmploiDuTempsService {

    private final EmploiDuTempsRepository repository;
    private final CoursRepository coursRepository;
    private final UserServiceClient userServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    /**
     * Envoie une notification à tous les enseignants concernés par un emploi du temps
     * En mode asynchrone pour ne pas bloquer l'appel HTTP
     */
    @Async
    public void notifyTeachers(String scheduleId, Map<String, Object> body) {
        log.info(" Début de la procédure de notification pour l'emploi du temps: {}", scheduleId);
        
        try {
            String attachmentBase64 = body != null ? (String) body.get("attachmentBase64") : null;
            String attachmentName = body != null ? (String) body.get("attachmentName") : null;

            EmploiDuTemps schedule = repository.findById(scheduleId)
                    .orElse(null);
            
            if (schedule == null) {
                log.error(" Impossible de notifier: Emploi du temps {} non trouvé", scheduleId);
                return;
            }
                    
            List<Cours> cours = coursRepository.findByEmploiDuTempsId(scheduleId);
            if (cours == null || cours.isEmpty()) {
                log.warn(" Aucun cours trouvé pour l'emploi du temps {}, personne à notifier.", scheduleId);
                return;
            }
            
            // Extraire les enseignants uniques
            Set<String> teacherIds = cours.stream()
                    .map(Cours::getEnseignantId)
                    .filter(id -> id != null && !id.trim().isEmpty() && !id.equalsIgnoreCase("TBA"))
                    .collect(Collectors.toSet());
                    
            log.info(" Détails planning: {}. {} enseignants identifiés. {} pièces jointes.", 
                    schedule.getTitre(), teacherIds.size(), (attachmentBase64 != null ? "1" : "0"));
            
            int successCount = 0;
            for (String teacherId : teacherIds) {
                try {
                    log.debug("   Récupération des infos pour l'enseignant: {}", teacherId);
                    Map<String, Object> teacher = userServiceClient.getUserById(teacherId);
                    
                    if (teacher != null && teacher.get("email") != null) {
                        String email = (String) teacher.get("email");
                        String firstName = (String) teacher.get("firstName");
                        String lastName = (String) teacher.get("lastName");
                        
                        Map<String, Object> notificationRequest = new HashMap<>();
                        notificationRequest.put("to", email);
                        notificationRequest.put("firstName", firstName != null ? firstName : "");
                        notificationRequest.put("lastName", lastName != null ? lastName : "");
                        notificationRequest.put("scheduleTitle", schedule.getTitre());
                        
                        // Ajouter la pièce jointe
                        if (attachmentBase64 != null) {
                            notificationRequest.put("attachmentBase64", attachmentBase64);
                            notificationRequest.put("attachmentName", attachmentName);
                        }
                        
                        notificationServiceClient.sendScheduleNotification(notificationRequest);
                        successCount++;
                        log.info(" Notification programmée pour: {} ({})", email, teacherId);
                    } else {
                        log.warn(" Enseignant {} trouvé mais sans email valide.", teacherId);
                    }
                } catch (Exception e) {
                    log.error(" Échec de notification pour l'enseignant {}: {}", teacherId, e.getMessage());
                    // On continue avec les autres enseignants
                }
            }
            log.info(" Fin de procédure. {} notifications envoyées avec succès sur {}.", successCount, teacherIds.size());
        } catch (Exception e) {
            log.error(" Erreur critique lors de la procédure de notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Déduit les heures plannifiées d'un emploi du temps du volume restant des cours (consommation effective)
     */
    @org.springframework.transaction.annotation.Transactional
    public void consommerHeuresSemaine(String scheduleId) {
        log.info("Début de la consommation des heures pour l'emploi du temps: {}", scheduleId);
        List<Cours> coursPlannifies = coursRepository.findByEmploiDuTempsId(scheduleId);
        
        if (coursPlannifies == null || coursPlannifies.isEmpty()) {
            log.warn("Aucun cours trouvé pour la consommation d'heures sur l'EDT {}", scheduleId);
            return;
        }

        for (Cours c : coursPlannifies) {
            if (c.getHeureDebut() == null || c.getHeureFin() == null) continue;

            // Identifier le cours "template" (celui qui sert de base au quota, sans horaire fixe)
            // On se base sur le nom, l'enseignant et le semestre
            List<Cours> possibleTemplates = coursRepository.findByNomIgnoreCaseAndEnseignantId(c.getNom(), c.getEnseignantId());
            
            Optional<Cours> templateOpt = possibleTemplates.stream()
                    .filter(t -> t.getHeureDebut() == null) // Le template n'a pas d'horaire
                    .filter(t -> t.getSemestre() != null && t.getSemestre().equals(c.getSemestre()))
                    .findFirst();

            if (templateOpt.isPresent()) {
                Cours template = templateOpt.get();
                int duree = (int) java.time.Duration.between(c.getHeureDebut(), c.getHeureFin()).toHours();
                
                int actuel = template.getVolumeRestant() != null ? template.getVolumeRestant() : 0;
                int nouveauRestant = Math.max(0, actuel - duree);
                
                template.setVolumeRestant(nouveauRestant);
                coursRepository.save(template);
                
                log.info("Cours '{}' (Template {}): -{}h effectué. Nouveau restant: {}h", 
                        template.getNom(), template.getIdCours(), duree, nouveauRestant);
            } else {
                log.warn("Impossible de trouver le template pour le cours plannifié: {} (ID: {})", c.getNom(), c.getIdCours());
            }
        }
        log.info("Fin de la consommation des heures pour l'emploi du temps: {}", scheduleId);
    }

    /**
     * Automatisation : Déclenchée tous les dimanches soir à 23h00.
     * Identifie les emplois du temps valides et actifs pour déduire les heures de la semaine écoulée.
     */
    @Scheduled(cron = "0 0 23 * * SUN")
    public void automatisationConsommationHebdomadaire() {
        log.info("--- [CLÔTURE HEBDO AUTOMATIQUE] Démarrage du processus ---");
        LocalDate today = LocalDate.now();
        
        // Trouver tous les EDT qui sont censés être appliqués en ce moment
        List<EmploiDuTemps> planningActifs = repository.findByStatutAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
                StatutEmp.VALIDE, today, today
        );

        if (planningActifs.isEmpty()) {
            log.info("[CLÔTURE HEBDO] Aucun emploi du temps actif à traiter ce dimanche.");
            return;
        }

        log.info("[CLÔTURE HEBDO] {} emploi(s) du temps identifiés pour consommation.", planningActifs.size());
        
        for (EmploiDuTemps edt : planningActifs) {
            try {
                consommerHeuresSemaine(edt.getId());
            } catch (Exception e) {
                log.error("[CLÔTURE HEBDO] Erreur lors du traitement de l'EDT {}: {}", edt.getId(), e.getMessage());
            }
        }
        
        log.info("--- [CLÔTURE HEBDO AUTOMATIQUE] Fin du processus ---");
    }
}
