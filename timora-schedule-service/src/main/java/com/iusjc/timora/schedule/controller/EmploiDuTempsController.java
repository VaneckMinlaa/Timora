package com.iusjc.timora.schedule.controller;

import com.iusjc.timora.schedule.dto.GenerateScheduleRequest;
import com.iusjc.timora.schedule.entity.Cours;
import com.iusjc.timora.schedule.dto.CoursResponse;
import com.iusjc.timora.schedule.service.EmploiDuTempsGeneratorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la génération et gestion des emplois du temps
 */
@RestController
@RequestMapping("/api/schedules/emplois-du-temps")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Emplois du temps", description = "API pour la génération automatique des emplois du temps")
@CrossOrigin(origins = "*")
public class EmploiDuTempsController {

    private final EmploiDuTempsGeneratorService generatorService;
    private final com.iusjc.timora.schedule.service.EmploiDuTempsService emploiDuTempsService;
    private final com.iusjc.timora.schedule.repository.EmploiDuTempsRepository repository;
    private final com.iusjc.timora.schedule.repository.CoursRepository coursRepository;

    @Operation(summary = "Récupérer tout l'historique", description = "Récupère la liste de tous les emplois du temps générés")
    @GetMapping
    public ResponseEntity<List<com.iusjc.timora.schedule.entity.EmploiDuTemps>> getAllEmplois() {
        log.info("Récupération de l'historique des emplois du temps");
        return ResponseEntity.ok(repository.findAll());
    }

    @Operation(summary = "Générer les emplois du temps", description = "Démarre la génération automatique (Glouton + Ford-Fulkerson)")
    @PostMapping("/generate")
    public ResponseEntity<List<CoursResponse>> generateTimetable(@RequestBody GenerateScheduleRequest request) {
        log.info("Appel de l'endpoint de génération d'emploi du temps pour le semestre : {}, classe: {}", request.getSemestre(), request.getClasseId());
        List<CoursResponse> emploisGeneres = generatorService.generateTimetable(request);
        return ResponseEntity.ok(emploisGeneres);
    }

    @Operation(summary = "Sauvegarder l'emploi du temps", description = "Enregistre l'historique et lie les cours au nouvel emploi du temps")
    @PostMapping
    public ResponseEntity<com.iusjc.timora.schedule.entity.EmploiDuTemps> saveEmploiDuTemps(@RequestBody com.iusjc.timora.schedule.dto.CreateEmploiDuTempsRequest request) {
        log.info("Sauvegarde de l'emploi du temps: {}", request.getTitre());
        com.iusjc.timora.schedule.entity.EmploiDuTemps emp = com.iusjc.timora.schedule.entity.EmploiDuTemps.builder()
                .titre(request.getTitre())
                .ecoleNom(request.getEcoleNom())
                .filiereNom(request.getFiliereNom())
                .classeNom(request.getClasseNom())
                .semestre(request.getSemestre())
                .classeId(request.getClasseId())
                .enseignantId(request.getEnseignantId())
                .semaine(request.getSemaine() != null ? request.getSemaine() : 1)
                .dateDebut(request.getDateDebut() != null ? request.getDateDebut() : java.time.LocalDate.now())
                .dateFin(request.getDateFin() != null ? request.getDateFin() : java.time.LocalDate.now().plusMonths(6))
                .statut(request.getStatut() != null ? request.getStatut() : com.iusjc.timora.schedule.entity.StatutEmp.VALIDE)
                .build();
        
        com.iusjc.timora.schedule.entity.EmploiDuTemps savedEmp = repository.save(emp);

        if (request.getCoursIds() != null && !request.getCoursIds().isEmpty()) {
            List<Cours> coursToUpdate = coursRepository.findAllById(request.getCoursIds());
            coursToUpdate.forEach(c -> c.setEmploiDuTempsId(savedEmp.getId()));
            coursRepository.saveAll(coursToUpdate);
        }

        return ResponseEntity.ok(savedEmp);
    }

    @Operation(summary = "Supprimer un emploi du temps", description = "Supprime un enregistrement et ses cours liés")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmploiDuTemps(@PathVariable String id) {
        log.info("Suppression de l'emploi du temps: {}", id);
        repository.findById(id).ifPresent(emp -> {
            List<Cours> cours = coursRepository.findByEmploiDuTempsId(id);
            if(cours != null && !cours.isEmpty()) {
                coursRepository.deleteAll(cours);
            }
            repository.delete(emp);
        });
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Consommer les heures de la semaine", description = "Déduit les heures plannifiées du volume restant total des cours")
    @PostMapping("/{id}/consume-hours")
    public ResponseEntity<Void> consumeHours(@PathVariable String id) {
        log.info("Consommation des heures pour l'emploi du temps: {}", id);
        emploiDuTempsService.consommerHeuresSemaine(id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Notifier les enseignants", description = "Envoie un email automatique aux enseignants pour les prévenir d'une mise à jour")
    @PostMapping("/{id}/notify-teachers")
    public ResponseEntity<Void> notifyTeachers(@PathVariable String id, @RequestBody java.util.Map<String, Object> body) {
        log.info("Appel de notification des enseignants pour l'emploi du temps: {}", id);
        emploiDuTempsService.notifyTeachers(id, body);
        return ResponseEntity.ok().build();
    }
}
