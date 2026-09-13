package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.client.ReservationServiceClient;
import com.iusjc.timora.schedule.client.RoomServiceClient;
import com.iusjc.timora.schedule.dto.CoursResponse;
import com.iusjc.timora.schedule.dto.GenerateScheduleRequest;
import com.iusjc.timora.schedule.entity.Cours;
import com.iusjc.timora.schedule.entity.TypeCours;
import com.iusjc.timora.schedule.repository.CoursRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service pour la génération d'emplois du temps
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmploiDuTempsGeneratorService {

    private final CoursRepository coursRepository;
    private final RoomServiceClient roomServiceClient;
    private final ReservationServiceClient reservationServiceClient;

    private static final Map<TypeCours, String> TYPE_COURS_TO_SALLE = Map.of(
            TypeCours.COURS_MAGISTRAL, "AMPHI",
            TypeCours.TD, "TD",
            TypeCours.TP, "LABORATOIRE",
            TypeCours.EXAMEN, "COURS"
    );

    private static final List<String> JOURS_SEMAINE = Arrays.asList(
            "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
    );

    // Créneaux de 2 heures
    private static final List<LocalTime[]> CRENEAUX = Arrays.asList(
            new LocalTime[]{LocalTime.of(8, 0), LocalTime.of(10, 0)},
            new LocalTime[]{LocalTime.of(10, 0), LocalTime.of(12, 0)},
            new LocalTime[]{LocalTime.of(13, 0), LocalTime.of(15, 0)},
            new LocalTime[]{LocalTime.of(15, 0), LocalTime.of(17, 0)},
            new LocalTime[]{LocalTime.of(17, 0), LocalTime.of(19, 0)}
    );

    private static final int MAX_AUGMENTATION_DEPTH = 3;

    static class TrancheCours {
        Cours originalCours;
        int quotaHebdo;
        boolean placed;
        String assignedJour;
        LocalTime assignedDebut;
        LocalTime assignedFin;
        String assignedSalleId;

        public TrancheCours(Cours cours, int quota) {
            this.originalCours = cours;
            this.quotaHebdo = quota;
            this.placed = false;
        }
    }

    /**
     * Génère l'emploi du temps pour les cours non planifiés
     */
    public List<CoursResponse> generateTimetable(GenerateScheduleRequest request) {
        log.info("Démarrage de la génération d'emploi du temps avec paramètres: {}", request);

        try {
            // 0. Supprimer les créneaux brouillons (non sauvegardés) pour forcer une regénération propre
            List<Cours> coursToReset = coursRepository.findAll().stream()
                    .filter(c -> c.getHeureDebut() != null) // Déjà placé
                    .filter(c -> c.getEmploiDuTempsId() == null) // Uniquement les brouillons non sauvegardés
                    .filter(c -> request.getSemestre() == null || request.getSemestre().trim().isEmpty() || (c.getSemestre() != null && request.getSemestre().equals(c.getSemestre().name())))
                    .filter(c -> request.getClasseId() == null || request.getClasseId().trim().isEmpty() || (c.getClasseIds() != null && c.getClasseIds().contains(request.getClasseId())))
                    .collect(Collectors.toList());
            if (!coursToReset.isEmpty()) {
                log.info("Suppression de {} créneaux brouillons existants pour regénération", coursToReset.size());
                
                // Restituer le volume aux cours initiaux (ceux non placés)
                for (Cours draft : coursToReset) {
                    coursRepository.findAll().stream()
                        .filter(c -> c.getHeureDebut() == null && c.getEmploiDuTempsId() == null)
                        .filter(c -> java.util.Objects.equals(c.getNom(), draft.getNom()) && java.util.Objects.equals(c.getEnseignantId(), draft.getEnseignantId()))
                        .findFirst()
                        .ifPresent(master -> {
                            int currentRestant = master.getVolumeRestant() != null ? master.getVolumeRestant() : 0;
                            master.setVolumeRestant(currentRestant + 2);
                            coursRepository.save(master);
                        });
                }
                
                coursRepository.deleteAll(coursToReset);
            }

            // 1. Récupérer les cours à placer (ceux qui n'ont pas d'horaires)
            List<Cours> coursAPlacer = coursRepository.findAll().stream()
                    .filter(c -> c.getHeureDebut() == null)
                    .filter(c -> request.getSemestre() == null || request.getSemestre().trim().isEmpty() || (c.getSemestre() != null && request.getSemestre().equals(c.getSemestre().name())))
                    .filter(c -> request.getClasseId() == null || request.getClasseId().trim().isEmpty() || (c.getClasseIds() != null && c.getClasseIds().contains(request.getClasseId())))
                    .collect(Collectors.toList());
            log.info("Trouvé {} cours à placer", coursAPlacer.size());

            // Récupérer les salles
            List<Map<String, Object>> salles;
            try {
                salles = roomServiceClient.getAllRooms();
                log.info("Récupération de {} salles de la base", salles != null ? salles.size() : 0);
                if (salles == null) salles = new ArrayList<>();
            } catch (Exception e) {
                log.error("Erreur lors de la récupération des salles: {}", e.getMessage(), e);
                salles = new ArrayList<>();
            }

        Map<String, List<Map<String, Object>>> profAvailabilities = new HashMap<>();
        Map<String, Integer> profHeuresDispo = new HashMap<>();

        for (Cours c : coursAPlacer) {
            String profId = c.getEnseignantId();
            if (profId != null && !profAvailabilities.containsKey(profId)) {
                try {
                    List<Map<String, Object>> dispos = reservationServiceClient.getDisponibilitesByUserId(profId);
                    if (dispos == null) dispos = new ArrayList<>();
                    profAvailabilities.put(profId, dispos);
                    profHeuresDispo.put(profId, calculerHeuresDispo(dispos));
                } catch (Exception e) {
                    log.error("Erreur dispos prof {}: {}", profId, e.getMessage());
                    profAvailabilities.put(profId, new ArrayList<>());
                    profHeuresDispo.put(profId, 0);
                }
            }
        }

        // 2. Découper en tranches de 2 heures selon les disponibilités
        List<TrancheCours> tranches = new ArrayList<>();
        for (Cours cours : coursAPlacer) {
            String profId = cours.getEnseignantId();
            
            // S'il n'a aucune disponibilité, il n'est pas disponible -> on ignore
            if (profId == null || !profHeuresDispo.containsKey(profId) || profHeuresDispo.get(profId) == 0) {
                log.warn("Cours {} ignoré car l'enseignant n'a aucune disponibilité.", cours.getNom());
                continue;
            }

            // Calcul du quota hebdomadaire : 1 crédit = 1h par semaine 
            int volHebdoCours = (cours.getCredits() != null && cours.getCredits() > 0) ? cours.getCredits() : 4;

            // Initialisation automatique du volume semestriel si absent (base standard de 15 semaines)
            if (cours.getVolumeTotal() == null || cours.getVolumeTotal() == 0) {
                int defaultTotal = volHebdoCours * 15;
                cours.setVolumeTotal(defaultTotal);
                cours.setVolumeRestant(defaultTotal);
                coursRepository.save(cours);
                log.info("Volume initialisé pour {}: {}h total", cours.getNom(), defaultTotal);
            }

            // Le quota à placer cette semaine est limité par le volume restant du cours
            int quotaAvailable = Math.min(profHeuresDispo.getOrDefault(profId, 0), volHebdoCours);
            int quota = Math.min(quotaAvailable, cours.getVolumeRestant() != null ? cours.getVolumeRestant() : 0);
            
            int nbTranches2h = (int) Math.ceil(quota / 2.0);
            log.info("Cours {}: planification de {}h ({} tranches) basée sur credits={}, restant={}h", 
                    cours.getNom(), quota, nbTranches2h, cours.getCredits(), cours.getVolumeRestant());
            
            for (int i = 0; i < nbTranches2h; i++) {
                tranches.add(new TrancheCours(cours, quota));
            }
        }

        // 3. Phase Gloutonne (Trier par dispo croissante - Moins de dispo = Plus de priorité)
        tranches.sort(Comparator.comparingInt((TrancheCours t) -> {
            String pId = t.originalCours.getEnseignantId();
            return profHeuresDispo.getOrDefault(pId, 999);
        }));

        // Grille de réservation globale
        // On modélise l'occupation courante (déjà en base + ce qu'on place)
        List<Cours> coursDejaPlaces = coursRepository.findAll().stream()
                .filter(c -> c.getHeureDebut() != null && c.getJourSemaine() != null)
                .collect(Collectors.toList());

        List<TrancheCours> nonPlaces = new ArrayList<>();

        for (TrancheCours tranche : tranches) {
            boolean placed = attemptGreedyPlacement(tranche, salles, coursDejaPlaces, profAvailabilities);
            if (placed) {
                // Créer un cours virtuel placé pour éviter les conflits des prochains
                Cours cPlace = copyWithPlacement(tranche);
                coursDejaPlaces.add(cPlace);
                tranche.placed = true;
            } else {
                nonPlaces.add(tranche);
            }
        }

        log.info("Phase gloutonne terminée. Non placés : {}", nonPlaces.size());

        // 4. Phase Optimisation: Ford-Fulkerson avec Bellman-Ford
        if (!nonPlaces.isEmpty() && !salles.isEmpty()) {
            runFordFulkersonOptimization(nonPlaces, salles, coursDejaPlaces, profAvailabilities);
        }

            // 5. Sauvegarder les résultats et mettre à jour les volumes restants
            List<CoursResponse> finalCourses = new ArrayList<>();
            for (TrancheCours tranche : tranches) {
                if (tranche.placed) {
                    // Update volume restant on the Master course
                    Cours master = tranche.originalCours;
                    int currentRestant = master.getVolumeRestant() != null ? master.getVolumeRestant() : 0;
                    // On retire 2h (durée d'une tranche standard)
                    master.setVolumeRestant(Math.max(0, currentRestant - 2));
                    coursRepository.save(master);

                    // Create the placed instance
                    Cours c = copyWithPlacement(tranche);
                    // On s'assure que l'instance placée a un volume restant cohérent ou nul pour ne pas être reprise
                    c.setVolumeRestant(0); 
                    
                    Cours savedCours = coursRepository.save(c);
                    finalCourses.add(mapToResponse(savedCours));
                }
            }

            log.info("Génération terminée avec succès. {} cours placés/sauvegardés.", finalCourses.size());
            return finalCourses;
        } catch (Exception e) {
            log.error("Une erreur interne critique s'est produite lors de la génération: ", e);
            throw new RuntimeException("Erreur critique lors de la génération: " + e.getMessage(), e);
        }
    }

    private com.iusjc.timora.schedule.dto.CoursResponse mapToResponse(Cours cours) {
        return com.iusjc.timora.schedule.dto.CoursResponse.builder()
                .idCours(cours.getIdCours())
                .nom(cours.getNom())
                .type(cours.getType())
                .semestre(cours.getSemestre())
                .enseignantId(cours.getEnseignantId())
                .salleId(cours.getSalleId())
                .emploiDuTempsId(cours.getEmploiDuTempsId())
                .ueIds(cours.getUeIds() != null ? new ArrayList<>(cours.getUeIds()) : new ArrayList<>())
                .classeIds(cours.getClasseIds() != null ? new ArrayList<>(cours.getClasseIds()) : new ArrayList<>())
                .niveau(cours.getNiveau())
                .credits(cours.getCredits())
                .volumeTotal(cours.getVolumeTotal())
                .volumeRestant(cours.getVolumeRestant())
                .jourSemaine(cours.getJourSemaine())
                .heureDebut(cours.getHeureDebut())
                .heureFin(cours.getHeureFin())
                .createdAt(cours.getCreatedAt())
                .updatedAt(cours.getUpdatedAt())
                .build();
    }

    private Cours copyWithPlacement(TrancheCours tranche) {
        return Cours.builder()
                .nom(tranche.originalCours.getNom() != null ? tranche.originalCours.getNom() : "Cours")
                .type(tranche.originalCours.getType() != null ? tranche.originalCours.getType() : TypeCours.COURS_MAGISTRAL)
                .semestre(tranche.originalCours.getSemestre())
                .enseignantId(tranche.originalCours.getEnseignantId())
                .salleId(tranche.assignedSalleId != null ? tranche.assignedSalleId : tranche.originalCours.getSalleId())
                .ueIds(tranche.originalCours.getUeIds() != null ? new ArrayList<>(tranche.originalCours.getUeIds()) : new ArrayList<>())
                .classeIds(tranche.originalCours.getClasseIds() != null ? new ArrayList<>(tranche.originalCours.getClasseIds()) : new ArrayList<>())
                .niveau(tranche.originalCours.getNiveau())
                .credits(tranche.originalCours.getCredits() != null ? tranche.originalCours.getCredits() : 2)
                .volumeTotal(tranche.originalCours.getVolumeTotal())
                .volumeRestant(tranche.originalCours.getVolumeRestant())
                .jourSemaine(tranche.assignedJour)
                .heureDebut(tranche.assignedDebut)
                .heureFin(tranche.assignedFin)
                .build();
    }

    private int calculerHeuresDispo(List<Map<String, Object>> dispos) {
        if (dispos == null || dispos.isEmpty()) return 0;
        int total = 0;
        for (Map<String, Object> dispo : dispos) {
            try {
                LocalTime dDebut = LocalTime.parse(dispo.get("heureDebut").toString());
                LocalTime dFin = LocalTime.parse(dispo.get("heureFin").toString());
                long duration = java.time.Duration.between(dDebut, dFin).toHours();
                total += (int) Math.max(0, duration);
            } catch (Exception e) {
                log.warn("Erreur parsing heure pour calcul dispo: {}", e.getMessage());
            }
        }
        return total;
    }

    private boolean isProfAvailable(String enseignantId, String jour, LocalTime debut, LocalTime fin, Map<String, List<Map<String, Object>>> profAvailabilities) {
        if (enseignantId == null) return true;
        
        if (!profAvailabilities.containsKey(enseignantId)) {
            try {
                List<Map<String, Object>> dispos = reservationServiceClient.getDisponibilitesByUserId(enseignantId);
                profAvailabilities.put(enseignantId, dispos != null ? dispos : new ArrayList<>());
            } catch (Exception e) {
                log.error("Erreur lors de la récupération des disponibilités de l'enseignant {}: {}", enseignantId, e.getMessage());
                profAvailabilities.put(enseignantId, new ArrayList<>());
            }
        }
        
        List<Map<String, Object>> dispos = profAvailabilities.get(enseignantId);
        
        // S'il n'y a aucune disponibilité, cela veut dire que l'enseignant n'est pas disponible
        if (dispos == null || dispos.isEmpty()) {
            return false;
        }
        
        for (Map<String, Object> dispo : dispos) {
            String dJour = (String) dispo.get("jour");
            // Nettoyage et comparaison robuste du jour
            if (dJour == null || !jour.trim().equalsIgnoreCase(dJour.trim())) continue;
            
            try {
                LocalTime dDebut = LocalTime.parse(dispo.get("heureDebut").toString());
                LocalTime dFin = LocalTime.parse(dispo.get("heureFin").toString());
                
                // Le créneau [debut, fin] doit être inclus dans la dispo [dDebut, dFin]
                if (!debut.isBefore(dDebut) && !fin.isAfter(dFin)) {
                    log.info("Disponibilité confirmée pour prof {} le {} {}-{}", enseignantId, jour, debut, fin);
                    return true;
                }
            } catch (Exception e) {
                log.warn("Format d'heure invalide pour dispo prof {}: {}", enseignantId, e.getMessage());
            }
        }
        return false;
    }

    private boolean attemptGreedyPlacement(TrancheCours tranche, List<Map<String, Object>> salles, List<Cours> places, Map<String, List<Map<String, Object>>> profAvailabilities) {
        String neededRoomType = TYPE_COURS_TO_SALLE.getOrDefault(tranche.originalCours.getType(), "COURS");
        
        for (String jour : JOURS_SEMAINE) {
            for (LocalTime[] creneau : CRENEAUX) {
                LocalTime debut = creneau[0];
                LocalTime fin = creneau[1];

                // Check prof availability
                if (!isProfAvailable(tranche.originalCours.getEnseignantId(), jour, debut, fin, profAvailabilities)) {
                    continue;
                }

                // Check prof conflict
                boolean profOccupe = false;
                if (tranche.originalCours.getEnseignantId() != null) {
                    profOccupe = places.stream().anyMatch(p -> 
                        p.getJourSemaine() != null && p.getJourSemaine().equals(jour) &&
                        p.getHeureDebut() != null && p.getHeureDebut().equals(debut) &&
                        p.getEnseignantId() != null && p.getEnseignantId().equals(tranche.originalCours.getEnseignantId())
                    );
                }
                if (profOccupe) continue;

                // Check class conflict
                boolean classOccupe = false;
                if (tranche.originalCours.getClasseIds() != null) {
                    for (String classeId : tranche.originalCours.getClasseIds()) {
                        classOccupe = places.stream().anyMatch(p -> 
                            p.getJourSemaine() != null && p.getJourSemaine().equals(jour) &&
                            p.getHeureDebut() != null && p.getHeureDebut().equals(debut) &&
                            p.getClasseIds() != null &&
                            p.getClasseIds().contains(classeId)
                        );
                        if (classOccupe) break;
                    }
                }
                if (classOccupe) continue;

                // Try to find a free room of the right type
                String assignedRoomId = null;
                if (!salles.isEmpty()) {
                    for (Map<String, Object> salle : salles) {
                        if (!neededRoomType.equalsIgnoreCase((String)salle.getOrDefault("typeSalle", "COURS"))) {
                            continue;
                        }
                        String roomId = (String) salle.get("idSalle");
                        if (roomId == null) continue;
                        
                        boolean roomOccupe = places.stream().anyMatch(p -> 
                            p.getJourSemaine() != null && p.getJourSemaine().equals(jour) &&
                            p.getHeureDebut() != null && p.getHeureDebut().equals(debut) &&
                            p.getSalleId() != null && roomId.equals(p.getSalleId())
                        );

                        if (!roomOccupe) {
                            assignedRoomId = roomId;
                            break;
                        }
                    }
                }

                // Place the course (with or without a room)
                tranche.assignedJour = jour;
                tranche.assignedDebut = debut;
                tranche.assignedFin = fin;
                tranche.assignedSalleId = assignedRoomId; // may be null if no room available
                if (assignedRoomId == null) {
                    log.warn("Cours {} placé sans salle (aucune salle de type {} disponible)", tranche.originalCours.getNom(), neededRoomType);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Recherche de chemin minimal avec Bellman-Ford (Successive Shortest Path)
     * pour répartir les cours non placés via récursion de déplacement
     */
    private void runFordFulkersonOptimization(List<TrancheCours> nonPlaces, List<Map<String, Object>> salles, List<Cours> places, Map<String, List<Map<String, Object>>> profAvailabilities) {
        log.info("Démarrage de l'optimisation Ford-Fulkerson récursive pour {} tranches", nonPlaces.size());
        
        for (TrancheCours tranche : new ArrayList<>(nonPlaces)) {
            // Tentative d'augmentation de chemin avec profondeur récursive
            Set<String> visitedIds = new HashSet<>();
            boolean augmented = augmentPathRecursive(tranche, salles, places, 0, visitedIds, profAvailabilities);
            
            if (augmented) {
                nonPlaces.remove(tranche);
            }
        }
    }

    private boolean augmentPathRecursive(TrancheCours current, List<Map<String, Object>> salles, List<Cours> places, int depth, Set<String> visitedIds, Map<String, List<Map<String, Object>>> profAvailabilities) {
        if (depth >= MAX_AUGMENTATION_DEPTH) return false;

        String neededRoomType = TYPE_COURS_TO_SALLE.getOrDefault(current.originalCours.getType(), "COURS");
        String currentProfId = current.originalCours.getEnseignantId();

        for (String jour : JOURS_SEMAINE) {
            for (LocalTime[] creneau : CRENEAUX) {
                LocalTime debut = creneau[0];
                LocalTime fin = creneau[1];

                // Check prof availability
                if (!isProfAvailable(currentProfId, jour, debut, fin, profAvailabilities)) {
                    continue;
                }

                // Contraintes strictes : Prof et Classe
                boolean profOccupe = currentProfId != null && places.stream().anyMatch(p -> 
                    jour.equals(p.getJourSemaine()) && debut.equals(p.getHeureDebut()) && currentProfId.equals(p.getEnseignantId())
                );
                if (profOccupe) continue;

                boolean classOccupe = false;
                if (current.originalCours.getClasseIds() != null) {
                    for (String clId : current.originalCours.getClasseIds()) {
                        classOccupe = places.stream().anyMatch(p -> 
                            jour.equals(p.getJourSemaine()) && debut.equals(p.getHeureDebut()) && p.getClasseIds() != null && p.getClasseIds().contains(clId)
                        );
                        if (classOccupe) break;
                    }
                }
                if (classOccupe) continue;

                // Chercher une salle (possiblement occupée par un cours déplaçable)
                for (Map<String, Object> salle : salles) {
                    if (!neededRoomType.equalsIgnoreCase((String)salle.getOrDefault("typeSalle", "COURS"))) continue;
                    String roomId = (String) salle.get("idSalle");
                    if (roomId == null) continue;

                    Optional<Cours> occupierOpt = places.stream().filter(p -> 
                        jour.equals(p.getJourSemaine()) && debut.equals(p.getHeureDebut()) && roomId.equals(p.getSalleId())
                    ).findFirst();

                    if (occupierOpt.isEmpty()) {
                        // Slot libre trouvé
                        applyTranchePlacement(current, jour, debut, fin, roomId, places);
                        return true;
                    } else {
                        // Tenter de déplacer l'occupant recursivement
                        Cours occupier = occupierOpt.get();
                        String occupierId = occupier.getIdCours() != null ? occupier.getIdCours() : occupier.hashCode() + "";
                        
                        if (visitedIds.contains(occupierId)) continue;
                        visitedIds.add(occupierId);

                        // On simule le déplacement de 'occupier' vers un autre slot
                        if (canDisplaceOccupier(occupier, salles, places, depth + 1, visitedIds, profAvailabilities)) {
                            applyTranchePlacement(current, jour, debut, fin, roomId, places);
                            log.info("Ford-Fulkerson : Résolution de conflit par déplacement récursif du cours {}", occupier.getNom());
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private void applyTranchePlacement(TrancheCours current, String jour, LocalTime debut, LocalTime fin, String roomId, List<Cours> places) {
        current.assignedJour = jour; 
        current.assignedDebut = debut; 
        current.assignedFin = fin; 
        current.assignedSalleId = roomId;
        current.placed = true;
        places.add(copyWithPlacement(current));
    }

    private boolean canDisplaceOccupier(Cours displaceable, List<Map<String, Object>> salles, List<Cours> places, int depth, Set<String> visitedIds, Map<String, List<Map<String, Object>>> profAvailabilities) {
        String neededType = TYPE_COURS_TO_SALLE.getOrDefault(displaceable.getType() != null ? displaceable.getType() : TypeCours.COURS_MAGISTRAL, "COURS");
        String profId = displaceable.getEnseignantId();

        for (String nJour : JOURS_SEMAINE) {
            for (LocalTime[] nCreneau : CRENEAUX) {
                LocalTime nDebut = nCreneau[0];
                LocalTime nFin = nCreneau[1];

                // Check prof availability
                if (!isProfAvailable(profId, nJour, nDebut, nFin, profAvailabilities)) {
                    continue;
                }

                // Ne pas revenir sur le même créneau
                if (nJour.equals(displaceable.getJourSemaine()) && nDebut.equals(displaceable.getHeureDebut())) continue;

                // Contraintes prof/classe pour le déplacé
                boolean pOccupe = profId != null && places.stream().filter(p -> p != displaceable).anyMatch(p -> 
                    nJour.equals(p.getJourSemaine()) && nDebut.equals(p.getHeureDebut()) && profId.equals(p.getEnseignantId())
                );
                if (pOccupe) continue;

                boolean cOccupe = false;
                if (displaceable.getClasseIds() != null) {
                    for (String cId : displaceable.getClasseIds()) {
                        cOccupe = places.stream().filter(p -> p != displaceable).anyMatch(p -> 
                            nJour.equals(p.getJourSemaine()) && nDebut.equals(p.getHeureDebut()) && p.getClasseIds() != null && p.getClasseIds().contains(cId)
                        );
                        if (cOccupe) break;
                    }
                }
                if (cOccupe) continue;

                for (Map<String, Object> nSalle : salles) {
                    if (!neededType.equalsIgnoreCase((String)nSalle.getOrDefault("typeSalle", "COURS"))) continue;
                    String nRoomId = (String) nSalle.get("idSalle");
                    
                    // Vérifier si ce nouveau slot est libre ou déplaçable
                    Optional<Cours> nextOccupier = places.stream().filter(p -> p != displaceable).filter(p -> 
                        nJour.equals(p.getJourSemaine()) && nDebut.equals(p.getHeureDebut()) && nRoomId.equals(p.getSalleId())
                    ).findFirst();

                    if (nextOccupier.isEmpty()) {
                        updateDisplacedCourse(displaceable, nJour, nDebut, nFin, nRoomId);
                        return true;
                    } else if (depth < MAX_AUGMENTATION_DEPTH) {
                        Cours next = nextOccupier.get();
                        String nextId = next.getIdCours() != null ? next.getIdCours() : next.hashCode() + "";
                        if (visitedIds.contains(nextId)) continue;
                        visitedIds.add(nextId);

                        if (canDisplaceOccupier(next, salles, places, depth + 1, visitedIds, profAvailabilities)) {
                            updateDisplacedCourse(displaceable, nJour, nDebut, nFin, nRoomId);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private void updateDisplacedCourse(Cours c, String jour, LocalTime d, LocalTime f, String s) {
        c.setJourSemaine(jour);
        c.setHeureDebut(d);
        c.setHeureFin(f);
        c.setSalleId(s);
    }

}
