package com.iusjc.timora.schedule.service;

import com.iusjc.timora.schedule.client.NotificationServiceClient;
import com.iusjc.timora.schedule.client.RoomServiceClient;
import com.iusjc.timora.schedule.client.UserServiceClient;
import com.iusjc.timora.schedule.dto.CreateCoursRequest;
import com.iusjc.timora.schedule.dto.CoursResponse;
import com.iusjc.timora.schedule.dto.UpdateCoursRequest;
import com.iusjc.timora.schedule.entity.*;
import com.iusjc.timora.schedule.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des cours
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CoursService {

    private final CoursRepository coursRepository;
    private final ClasseRepository classeRepository;
    private final FiliereRepository filiereRepository;
    private final UERepository ueRepository;
    private final UserServiceClient userServiceClient;
    private final RoomServiceClient roomServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    /**
     * Mapping entre TypeCours et TypeSalle selon les règles métier
     */
    private static final Map<TypeCours, String> TYPE_COURS_TO_SALLE = Map.of(
            TypeCours.COURS_MAGISTRAL, "AMPHI",
            TypeCours.TD, "TD",
            TypeCours.TP, "LABORATOIRE",
            TypeCours.EXAMEN, "COURS" 
    );

    /**
     * Crée un cours avec assignation automatique de groupes selon filières/niveaux
     */
    public CoursResponse createCours(CreateCoursRequest request) {
        log.info("Création d'un cours: {}", request.getNom());

        // 0. Vérifier les doublons avant toute création
        if (coursRepository.existsByNomIgnoreCaseAndEnseignantIdAndSemestre(
                request.getNom(), request.getEnseignantId(), request.getSemestre())) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.CONFLICT,
                "Un cours identique (même nom, enseignant et semestre) existe déjà."
            );
        }

        // 1. Valider l'enseignant
        validateEnseignant(request.getEnseignantId());

        // 2. Assigner automatiquement les classes si filière/niveau fournis
        List<String> classeIds = assignClassesAutomatically(request);

        // 3. Assigner automatiquement une salle selon le type de cours
        String salleId = assignSalleAutomatically(request);

        // 4. Créer le cours
        Cours cours = Cours.builder()
                .nom(request.getNom())
                .type(request.getType())
                .semestre(request.getSemestre())
                .enseignantId(request.getEnseignantId())
                .salleId(salleId)
                .ueIds(request.getUeIds() != null ? new ArrayList<>(request.getUeIds()) : new ArrayList<>())
                .classeIds(classeIds)
                .niveau(request.getNiveau())
                .credits(request.getCredits())
                .volumeTotal(request.getVolumeTotal() != null ? request.getVolumeTotal() : (request.getCredits() != null ? request.getCredits() * 15 : 30))
                .volumeRestant(request.getVolumeRestant() != null ? request.getVolumeRestant() : (request.getVolumeTotal() != null ? request.getVolumeTotal() : (request.getCredits() != null ? request.getCredits() * 15 : 30)))
                .jourSemaine(request.getJourSemaine())
                .heureDebut(request.getHeureDebut())
                .heureFin(request.getHeureFin())
                .build();

        Cours savedCours = coursRepository.save(cours);

        // 5. Gérer les cours récurrents
        if (Boolean.TRUE.equals(request.getEstRecurrent()) && request.getDateDebut() != null && request.getDateFin() != null) {
            createRecurringCourses(savedCours, request);
        }

        // 6. Envoyer les notifications aux étudiants et enseignants
        sendCourseNotifications(savedCours, request);

        log.info("Cours créé avec succès: {}", savedCours.getIdCours());
        return enrichCoursResponse(savedCours, request.getNiveau());
    }

    /**
     * Assignation automatique des classes selon filière/niveau
     */
    private List<String> assignClassesAutomatically(CreateCoursRequest request) {
        List<String> classeIds = new ArrayList<>();

        // Si des classes sont déjà spécifiées, les utiliser
        if (request.getClasseIds() != null && !request.getClasseIds().isEmpty()) {
            classeIds.addAll(request.getClasseIds());
        }
        // Sinon, assigner automatiquement selon filière/niveau
        else if (request.getFiliereId() != null) {
            // Filtrer par niveau si fourni
            List<Classe> classes;
            if (request.getNiveau() != null && !request.getNiveau().isEmpty()) {
                log.info("Filtrage par niveau {} pour la filière {}", request.getNiveau(), request.getFiliereId());
                classes = classeRepository.findByFiliereIdAndNiveau(request.getFiliereId(), request.getNiveau());
            } else {
                classes = classeRepository.findByFiliereId(request.getFiliereId());
            }

            // Filtrer par école si fourni
            List<Classe> filteredClasses = classes;
            if (request.getEcoleId() != null && !request.getEcoleId().isEmpty()) {
                filteredClasses = classes.stream()
                        .filter(c -> request.getEcoleId().equals(c.getEcoleId()))
                        .collect(Collectors.toList());
            }

            classeIds = filteredClasses.stream()
                    .map(Classe::getIdClasse)
                    .collect(Collectors.toList());

            log.info("Assignation automatique de {} classes pour la filière {}", classeIds.size(), request.getFiliereId());
            
            // Si aucune classe trouvée, on permet quand même la création du cours
            // Les classes pourront être assignées plus tard
            if (classeIds.isEmpty()) {
                log.warn("Aucune classe trouvée pour la filière {}. Le cours sera créé sans classes assignées.", request.getFiliereId());
            }
        }

        // Ne plus lancer d'exception si aucune classe n'est assignée
        // Le cours peut être créé sans classes et les classes peuvent être ajoutées plus tard
        if (classeIds.isEmpty() && request.getClasseIds() == null && request.getFiliereId() == null) {
            log.warn("Aucune classe assignée au cours. Le cours sera créé sans classes.");
        }

        return classeIds;
    }

    /**
     * Assignation automatique d'une salle selon le type de cours
     */
    private String assignSalleAutomatically(CreateCoursRequest request) {
        // Si une salle est déjà spécifiée, l'utiliser
        if (request.getSalleId() != null && !request.getSalleId().isEmpty()) {
            return request.getSalleId();
        }

        // Sinon, trouver une salle disponible du type approprié
        String typeSalle = TYPE_COURS_TO_SALLE.get(request.getType());
        if (typeSalle == null) {
            throw new IllegalArgumentException("Type de cours non reconnu: " + request.getType());
        }

        try {
            // Calculer la capacité minimale nécessaire (somme des effectifs des classes)
            Integer capaciteMin = null;
            if (request.getClasseIds() != null && !request.getClasseIds().isEmpty()) {
                List<Classe> classes = classeRepository.findAllById(request.getClasseIds());
                capaciteMin = classes.stream()
                        .mapToInt(Classe::getEffectif)
                        .sum();
            }

            // Récupérer les salles disponibles
            List<Map<String, Object>> salles = roomServiceClient.getAvailableRoomsByType(typeSalle, capaciteMin);

            if (salles == null || salles.isEmpty()) {
                log.warn("Aucune salle disponible de type {} trouvée", typeSalle);
                return null; // Pas de salle assignée, mais le cours peut être créé
            }

            // Prendre la première salle disponible
            String salleId = (String) salles.get(0).get("idSalle");
            log.info("Salle {} assignée automatiquement pour le cours de type {}", salleId, request.getType());
            return salleId;

        } catch (Exception e) {
            log.error("Erreur lors de l'assignation automatique de salle: {}", e.getMessage());
            return null; // Pas de salle assignée, mais le cours peut être créé
        }
    }

    /**
     * Crée des cours récurrents (répétition hebdomadaire)
     */
    private void createRecurringCourses(Cours coursTemplate, CreateCoursRequest request) {
        LocalDate dateDebut = request.getDateDebut();
        LocalDate dateFin = request.getDateFin();
        String jourSemaine = request.getJourSemaine();

        if (dateDebut == null || dateFin == null || jourSemaine == null) {
            log.warn("Paramètres incomplets pour cours récurrent, création annulée");
            return;
        }

        // Convertir le jour de la semaine en numéro (1=Lundi, 7=Dimanche)
        int jourNumero = getJourNumero(jourSemaine);
        if (jourNumero == -1) {
            log.warn("Jour de la semaine invalide: {}", jourSemaine);
            return;
        }

        // Calculer toutes les dates pour ce jour de la semaine entre dateDebut et dateFin
        LocalDate dateCourante = dateDebut;
        int nombreOccurrences = 0;
        int maxOccurrences = request.getNombreOccurrences() != null ? request.getNombreOccurrences() : Integer.MAX_VALUE;

        while (!dateCourante.isAfter(dateFin) && nombreOccurrences < maxOccurrences) {
            // Trouver le prochain jour correspondant
            int joursAjouter = (jourNumero - dateCourante.getDayOfWeek().getValue() + 7) % 7;
            if (joursAjouter == 0 && dateCourante.getDayOfWeek().getValue() == jourNumero) {
                // On est déjà sur le bon jour
                joursAjouter = 0;
            }

            LocalDate dateCours = dateCourante.plusDays(joursAjouter);

            if (!dateCours.isAfter(dateFin)) {
                // Créer une instance de cours pour cette date
                Cours coursRecurrent = Cours.builder()
                        .nom(coursTemplate.getNom() + " - " + dateCours.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                        .type(coursTemplate.getType())
                        .semestre(coursTemplate.getSemestre())
                        .enseignantId(coursTemplate.getEnseignantId())
                        .salleId(coursTemplate.getSalleId())
                        .ueIds(new ArrayList<>(coursTemplate.getUeIds()))
                        .classeIds(new ArrayList<>(coursTemplate.getClasseIds()))
                        .jourSemaine(jourSemaine)
                        .heureDebut(coursTemplate.getHeureDebut())
                        .heureFin(coursTemplate.getHeureFin())
                        .build();

                coursRepository.save(coursRecurrent);
                nombreOccurrences++;

                // Passer à la semaine suivante
                dateCourante = dateCours.plusWeeks(1);
            } else {
                break;
            }
        }

        log.info("{} cours récurrents créés pour le cours {}", nombreOccurrences, coursTemplate.getNom());
    }

    /**
     * Convertit un jour de la semaine en numéro (1=Lundi, 7=Dimanche)
     */
    private int getJourNumero(String jourSemaine) {
        Map<String, Integer> jours = Map.of(
                "Lundi", 1,
                "Mardi", 2,
                "Mercredi", 3,
                "Jeudi", 4,
                "Vendredi", 5,
                "Samedi", 6,
                "Dimanche", 7
        );
        return jours.getOrDefault(jourSemaine, -1);
    }

    /**
     * Envoie des notifications aux étudiants et enseignants concernés
     */
    private void sendCourseNotifications(Cours cours, CreateCoursRequest request) {
        try {
            // Récupérer les informations de l'enseignant
            Map<String, Object> enseignant = userServiceClient.getUserById(cours.getEnseignantId());
            String emailEnseignant = enseignant != null ? (String) enseignant.get("email") : null;
            String firstName = enseignant != null ? (String) enseignant.get("firstName") : "";
            String lastName = enseignant != null ? (String) enseignant.get("lastName") : "";
            String nomEnseignant = firstName + " " + lastName;

            // Récupérer les informations de la salle
            String nomSalle = "Non assignée";
            if (cours.getSalleId() != null) {
                try {
                    Map<String, Object> salle = roomServiceClient.getRoomById(cours.getSalleId());
                    if (salle != null && salle.get("nomsalle") != null) {
                        nomSalle = (String) salle.get("nomsalle");
                    }
                } catch (Exception e) {
                    log.warn("Impossible de récupérer les informations de la salle: {}", e.getMessage());
                }
            }

            // Préparer le message pour l'enseignant
            String sujetEnseignant = "Nouveau cours créé: " + cours.getNom();
            String contenuEnseignant = String.format(
                    "Bonjour %s,\n\n" +
                            "Un nouveau cours a été créé:\n\n" +
                            "Nom: %s\n" +
                            "Type: %s\n" +
                            "Salle: %s\n" +
                            "Horaires: %s %s - %s\n\n" +
                            "Cordialement,\n" +
                            "Système Timora",
                    nomEnseignant,
                    cours.getNom(),
                    cours.getType(),
                    nomSalle,
                    request.getJourSemaine(),
                    request.getHeureDebut(),
                    request.getHeureFin()
            );

            // Envoyer notification à l'enseignant
            Map<String, Object> emailRequestEnseignant = Map.of(
                    "to", emailEnseignant,
                    "subject", sujetEnseignant,
                    "content", contenuEnseignant
            );
            notificationServiceClient.sendEmail(emailRequestEnseignant);

            // Récupérer les étudiants des classes concernées
            List<String> emailsEtudiants = getEmailsEtudiants(cours.getClasseIds());

            // Envoyer notification à chaque étudiant
            String sujetEtudiant = "Nouveau cours: " + cours.getNom();
            for (String emailEtudiant : emailsEtudiants) {
                String contenuEtudiant = String.format(
                        "Bonjour,\n\n" +
                                "Un nouveau cours a été ajouté à votre emploi du temps:\n\n" +
                                "Nom: %s\n" +
                                "Type: %s\n" +
                                "Enseignant: %s\n" +
                                "Salle: %s\n" +
                                "Horaires: %s %s - %s\n\n" +
                                "Cordialement,\n" +
                                "Système Timora",
                        cours.getNom(),
                        cours.getType(),
                        nomEnseignant,
                        nomSalle,
                        request.getJourSemaine(),
                        request.getHeureDebut(),
                        request.getHeureFin()
                );

                Map<String, Object> emailRequestEtudiant = Map.of(
                        "to", emailEtudiant,
                        "subject", sujetEtudiant,
                        "content", contenuEtudiant
                );
                notificationServiceClient.sendEmail(emailRequestEtudiant);
            }

            log.info("Notifications envoyées à l'enseignant et {} étudiants", emailsEtudiants.size());

        } catch (Exception e) {
            log.warn("Notification non envoyée (service indisponible ou endpoint manquant): {}", e.getMessage());
            // Ne pas faire échouer la création du cours si les notifications échouent
        }
    }

    /**
     * Récupère les emails des étudiants des classes concernées
     */
    private List<String> getEmailsEtudiants(List<String> classeIds) {
        List<String> emails = new ArrayList<>();
        // Note: Cette méthode nécessiterait un endpoint dans UserService pour récupérer les étudiants par classeId
        // Pour l'instant, on retourne une liste vide
        // TODO: Implémenter la récupération des étudiants par classeId via UserServiceClient
        log.warn("Récupération des emails étudiants non encore implémentée");
        return emails;
    }

    /**
     * Valide que l'enseignant existe et est bien un enseignant
     */
    private void validateEnseignant(String enseignantId) {
        try {
            Map<String, Object> user = userServiceClient.getUserById(enseignantId);
            if (user == null) {
                throw new IllegalArgumentException("Enseignant introuvable");
            }
            String role = (String) user.get("role");
            if (!"ENSEIGNANT".equals(role)) {
                throw new IllegalArgumentException("L'utilisateur spécifié n'est pas un enseignant");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Enseignant introuvable: " + e.getMessage());
        }
    }

    /**
     * Enrichit un CoursResponse avec les informations de filière et niveau
     */
    private CoursResponse enrichCoursResponse(Cours cours) {
        return enrichCoursResponse(cours, null);
    }

    /**
     * Enrichit un CoursResponse avec les informations de filière et niveau
     * @param cours 
     * @param niveauFromRequest Le niveau fourni lors de la création 
     */
    private CoursResponse enrichCoursResponse(Cours cours, String niveauFromRequest) {
        CoursResponse.CoursResponseBuilder builder = CoursResponse.builder()
                .idCours(cours.getIdCours())
                .nom(cours.getNom())
                .type(cours.getType())
                .semestre(cours.getSemestre())
                .enseignantId(cours.getEnseignantId())
                .salleId(cours.getSalleId())
                .emploiDuTempsId(cours.getEmploiDuTempsId())
                .ueIds(cours.getUeIds() != null ? new ArrayList<>(cours.getUeIds()) : new ArrayList<>())
                .classeIds(cours.getClasseIds() != null ? new ArrayList<>(cours.getClasseIds()) : new ArrayList<>())
                .credits(cours.getCredits())
                .volumeTotal(cours.getVolumeTotal())
                .volumeRestant(cours.getVolumeRestant())
                .jourSemaine(cours.getJourSemaine())
                .heureDebut(cours.getHeureDebut())
                .heureFin(cours.getHeureFin())
                .createdAt(cours.getCreatedAt())
                .updatedAt(cours.getUpdatedAt());

        String filiereId = null;
        String filiereNom = null;
        // Utiliser le niveau stocké dans le cours, sinon celui fourni lors de la création
        String niveau = cours.getNiveau() != null ? cours.getNiveau() : niveauFromRequest;

        // 1. Essayer de récupérer la filière depuis les classes
        if (cours.getClasseIds() != null && !cours.getClasseIds().isEmpty()) {
            try {
                Classe premiereClasse = classeRepository.findById(cours.getClasseIds().get(0)).orElse(null);
                if (premiereClasse != null && premiereClasse.getFiliereId() != null) {
                    Filiere filiere = filiereRepository.findById(premiereClasse.getFiliereId()).orElse(null);
                    if (filiere != null) {
                        filiereId = filiere.getIdFiliere();
                        filiereNom = filiere.getNom();
                    }
                }
            } catch (Exception e) {
                log.warn("Erreur lors de la récupération de la filière depuis les classes pour le cours {}: {}", cours.getIdCours(), e.getMessage());
            }
        }

        // 2. Si pas de filière trouvée depuis les classes, essayer depuis les UEs
        if (filiereId == null && cours.getUeIds() != null && !cours.getUeIds().isEmpty()) {
            try {
                UE premiereUE = ueRepository.findById(cours.getUeIds().get(0)).orElse(null);
                if (premiereUE != null && premiereUE.getFiliereId() != null) {
                    Filiere filiere = filiereRepository.findById(premiereUE.getFiliereId()).orElse(null);
                    if (filiere != null) {
                        filiereId = filiere.getIdFiliere();
                        filiereNom = filiere.getNom();
                    }
                }
            } catch (Exception e) {
                log.warn("Erreur lors de la récupération de la filière depuis les UEs pour le cours {}: {}", cours.getIdCours(), e.getMessage());
            }
        }

        // 3. Si le niveau n'a pas été fourni lors de la création, essayer de le récupérer depuis les étudiants via UserService
        if (niveau == null && filiereId != null) {
            try {
                // Essayer avec différents niveaux pour trouver des étudiants
                String[] niveauxPossibles = {"L1", "L2", "L3", "M1", "M2", "1", "2", "3", "4", "5"};
                for (String niveauTest : niveauxPossibles) {
                    try {
                        List<Map<String, Object>> students = userServiceClient.getStudentsByFiliere(filiereId, niveauTest, null);
                        if (students != null && !students.isEmpty()) {
                            // Vérifier si les étudiants retournés ont le niveau dans leur structure
                            // Note: UserResponse ne contient pas le niveau, mais on peut utiliser le niveau du filtre
                            niveau = niveauTest;
                            log.debug("Niveau trouvé pour le cours {} via UserService avec filtre: {}", cours.getIdCours(), niveauTest);
                            break;
                        }
                    } catch (Exception e) {
                        // Continuer avec le niveau suivant
                        continue;
                    }
                }
                
                // Si toujours pas de niveau trouvé, essayer sans filtre de niveau pour récupérer au moins un étudiant
                if (niveau == null) {
                    try {
                        List<Map<String, Object>> students = userServiceClient.getStudentsByFiliere(filiereId, null, null);
                        if (students != null && !students.isEmpty()) {
                            // Essayer de récupérer le niveau depuis la structure de l'étudiant
                            // Note: UserResponse ne contient pas le niveau, donc on ne peut pas le récupérer directement
                            // Pour l'instant, on laisse niveau à null
                            log.debug("Étudiants trouvés pour la filière {} mais niveau non disponible dans UserResponse", filiereId);
                        }
                    } catch (Exception e) {
                        log.debug("Impossible de récupérer les étudiants depuis UserService pour le cours {}: {}", cours.getIdCours(), e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.debug("Impossible de récupérer le niveau depuis UserService pour le cours {}: {}", cours.getIdCours(), e.getMessage());
            }
        }

        // Appliquer les valeurs trouvées
        if (filiereId != null) {
            builder.filiereId(filiereId);
        }
        if (filiereNom != null) {
            builder.filiereNom(filiereNom);
        }
        if (niveau != null) {
            builder.niveau(niveau);
        }

        return builder.build();
    }

    /**
     * Récupère un cours par ID
     */
    @Transactional(readOnly = true)
    public CoursResponse getCoursById(String id) {
        Cours cours = coursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cours introuvable: " + id));
        return enrichCoursResponse(cours);
    }

    /**
     * Récupère tous les cours (sans doublons)
     */
    @Transactional(readOnly = true)
    public List<CoursResponse> getAllCours() {
        return coursRepository.findAll().stream()
                .map(this::enrichCoursResponse)
                .collect(Collectors.toList());
    }

    /**
     * Met à jour un cours
     */
    public CoursResponse updateCours(String id, UpdateCoursRequest request) {
        Cours cours = coursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cours introuvable: " + id));

        if (request.getNom() != null) {
            cours.setNom(request.getNom());
        }
        if (request.getType() != null) {
            cours.setType(request.getType());
        }
        if (request.getEnseignantId() != null) {
            validateEnseignant(request.getEnseignantId());
            cours.setEnseignantId(request.getEnseignantId());
        }
        if (request.getSalleId() != null) {
            cours.setSalleId(request.getSalleId());
        }
        if (request.getUeIds() != null) {
            cours.setUeIds(new ArrayList<>(request.getUeIds()));
        }
        if (request.getClasseIds() != null) {
            cours.setClasseIds(new ArrayList<>(request.getClasseIds()));
        }
        if (request.getCredits() != null) {
            cours.setCredits(request.getCredits());
        }
        if (request.getJourSemaine() != null) {
            cours.setJourSemaine(request.getJourSemaine());
        }
        if (request.getHeureDebut() != null) {
            cours.setHeureDebut(request.getHeureDebut());
        }
        if (request.getHeureFin() != null) {
            cours.setHeureFin(request.getHeureFin());
        }
        if (request.getVolumeTotal() != null) {
            cours.setVolumeTotal(request.getVolumeTotal());
            // Si on change le total, on peut vouloir recalculer le restant proportionnellement,
            // mais ici on garde simple.
        } else if (request.getCredits() != null && (cours.getVolumeTotal() == null || cours.getVolumeTotal() == 0)) {
            cours.setVolumeTotal(request.getCredits() * 15);
        }

        if (request.getVolumeRestant() != null) {
            cours.setVolumeRestant(request.getVolumeRestant());
        } else if (cours.getVolumeRestant() == null) {
            cours.setVolumeRestant(cours.getVolumeTotal());
        }

        cours = coursRepository.save(cours);
        return enrichCoursResponse(cours);
    }

    /**
     * Supprime un cours
     */
    public void deleteCours(String id) {
        if (!coursRepository.existsById(id)) {
            throw new RuntimeException("Cours introuvable: " + id);
        }
        coursRepository.deleteById(id);
        log.info("Cours supprimé: {}", id);
    }

    /**
     * Récupère les cours d'un enseignant
     */
    @Transactional(readOnly = true)
    public List<CoursResponse> getCoursByEnseignant(String enseignantId) {
        return coursRepository.findByEnseignantId(enseignantId).stream()
                .map(this::enrichCoursResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les cours d'une classe
     */
    @Transactional(readOnly = true)
    public List<CoursResponse> getCoursByClasse(String classeId) {
        return coursRepository.findByClasseId(classeId).stream()
                .map(this::enrichCoursResponse)
                .collect(Collectors.toList());
    }

    /**
     * Supprime les cours en double (même nom + enseignant + semestre).
     * Conserve le plus récent dans chaque groupe.
     * @return nombre de doublons supprimés
     */
    @Transactional
    public int deduplicateCours() {
        List<Cours> all = coursRepository.findAll();

        // Grouper par clé de duplication
        Map<String, List<Cours>> groups = new LinkedHashMap<>();
        for (Cours c : all) {
            String key = (c.getNom() == null ? "" : c.getNom().toLowerCase())
                    + "|" + c.getEnseignantId()
                    + "|" + c.getSemestre();
            groups.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(c);
        }

        int removed = 0;
        for (Map.Entry<String, List<Cours>> entry : groups.entrySet()) {
            List<Cours> group = entry.getValue();
            if (group.size() <= 1) continue;

            // Garder le plus récent
            group.sort(Comparator.comparing(
                c -> c.getCreatedAt() != null ? c.getCreatedAt() : java.time.LocalDateTime.MIN,
                Comparator.reverseOrder()
            ));

            // Supprimer tous sauf le premier (le plus récent)
            List<Cours> toDelete = group.subList(1, group.size());
            for (Cours dup : toDelete) {
                coursRepository.deleteById(dup.getIdCours());
                removed++;
                log.info("Doublon supprimé: {} (id={})", dup.getNom(), dup.getIdCours());
            }
        }

        log.info("Déduplication terminée: {} doublon(s) supprimé(s)", removed);
        return removed;
    }
}
