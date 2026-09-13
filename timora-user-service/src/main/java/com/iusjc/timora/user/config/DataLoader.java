package com.iusjc.timora.user.config;

import com.iusjc.timora.user.entity.Etudiant;
import com.iusjc.timora.user.entity.User;
import com.iusjc.timora.user.repository.EtudiantRepository;
import com.iusjc.timora.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataLoader pour créer des utilisateurs par défaut au démarrage
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EtudiantRepository etudiantRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createDefaultUsers();
        createDefaultTeachers();
        createDefaultStudents();
    }

    private void createDefaultUsers() {
        log.info(" Vérification des utilisateurs par défaut...");

        // Créer un administrateur par défaut
        if (!userRepository.existsByEmail("admin@timora.com")) {
            User admin = User.builder()
                    .nom("Admin")
                    .prenom("Timora")
                    .email("admin@timora.com")
                    .telephone(123456789)
                    .role(User.RoleUtilisateur.ADMINISTRATEUR)
                    .motDePasse(passwordEncoder.encode("Admin123!"))
                    .isActive(true)
                    .department("Administration")
                    .organization("Timora")
                    .build();

            userRepository.save(admin);
            log.info(" Administrateur créé: admin@timora.com / Admin123!");
        }

        // Créer un enseignant par défaut
        if (!userRepository.existsByEmail("prof@timora.com")) {
            User prof = User.builder()
                    .nom("Professeur")
                    .prenom("Test")
                    .email("prof@timora.com")
                    .telephone(987654321)
                    .role(User.RoleUtilisateur.ENSEIGNANT)
                    .motDePasse(passwordEncoder.encode("Prof123!"))
                    .isActive(true)
                    .department("Informatique")
                    .organization("Timora")
                    .build();

            userRepository.save(prof);
            log.info(" Enseignant créé: prof@timora.com / Prof123!");
        }
    }

    private void createDefaultTeachers() {
        log.info(" Initialisation de 25 enseignants de test...");
        String[][] teachersData = {
            {"Kouamou", "Pr", "kouamou@timora.com", "Informatique"},
            {"Kengne", "Dr", "kengne@timora.com", "Électronique"},
            {"Moupojou", "Dr", "moupojou@timora.com", "Systèmes"},
            {"Toussile", "Dr", "toussil@timora.com", "Réseaux"},
            {"Cheick", "Dr ", "cheick@timora.com", "Génie Logiciel"},
            {"Pessa", "Mr", "pessa@timora.com", "Mathématiques"},
            {"Akono", "Mr", "akono@timora.com", "Gestion"},
            {"Koueta", "Mme", "koueta@timora.com", "Big Data"},
            {"Abdouraman", "Mr", "abdouraman@timora.com", "Cybersécurité"},
            {"Georges", "Dr", "georges@timora.com", "IA"},
            {"Nombo", "Mr", "nombo@timora.com", "IA"},
            {"Mondo", "Dr", "mondo@timora.com", "IA"},
            {"Ngolo", "Mme", "ngolo@timora.com", "IA"},
            {"Moyou", "Mr", "moyou@timora.com", "IA"},
            {"Tamko", "Ing", "tamko@timora.com", "IA"},
            {"Atcha", "Dr", "atcha@timora.com", "IA"},
            {"Touoyem", "Pr", "touoyem@timora.com", "IA"},
            {"Melataguia", "Pr", "touoyem@timora.com", "IA"},
            {"Ngwobela", "Dr", "ngwobela@timora.com", "IA"},
            {"Belom", "Ing", "belom@timora.com", "IA"},
            {"Bilong", "Dr", "bilong@timora.com", "IA"},
            {"Tiyou", "Ing", "tiyou@timora.com", "IA"},
            {"Nitcheu", "Ing", "nitcheu@timora.com", "IA"},
            {"Mahamat", "Dr", "mahamat@timora.com", "IA"},
            {"Nkoa", "Fr", "nkoa@timora.com", "IA"}
        };

        for (String[] t : teachersData) {
            if (!userRepository.existsByEmail(t[2])) {
                User prof = User.builder()
                        .nom(t[0])
                        .prenom(t[1])
                        .email(t[2])
                        .telephone(600000000 + (int)(Math.random() * 99999999))
                        .role(User.RoleUtilisateur.ENSEIGNANT)
                        .motDePasse(passwordEncoder.encode("Timora2024!"))
                        .isActive(true)
                        .department(t[3])
                        .organization("Timora")
                        .build();
                userRepository.save(prof);
                log.info(" Enseignant créé: {} (Mdp: Timora2024!)", t[2]);
            }
        }
    }

    private void createDefaultStudents() {
        log.info(" Vérification des étudiants par défaut...");

        if (etudiantRepository.count() == 0) {
            Etudiant etudiant = Etudiant.builder()
                    .nom("BILOGUE")
                    .prenom("Eric")
                    .email("bilogue.eric@saintjeaningeneieur.org")
                    .telephone("652020304")
                    .filiereId("Informatique et Système d'Information")
                    .niveau("4ème Année")
                    .ecoleId("ISJ")
                    .classeId("ING4 ISI FR")
                    .build();

            etudiantRepository.save(etudiant);
            log.info(" Étudiant par défaut créé: bilogue.eric@saintjeaningeneieur.org");
        }
    }
}
