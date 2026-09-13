package com.iusjc.timora.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité Notification selon le diagramme de classe UML
 */
@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_notification")
    private String idNotification;  // idNotification: string selon le diagramme

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeNotif canal;  // canal: TypeNotif selon le diagramme

    @Column(nullable = false)
    private LocalDateTime dateEnvoie;  // dateEnvoie: Date selon le diagramme

    @Column(nullable = false)
    private String statut;  // statut: string selon le diagramme

    // Contenu de la notification
    @Column(nullable = false)
    private String sujet;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    // Référence à Utilisateur (dans UserService)
    @Column(nullable = false)
    private String utilisateurId;
    
    // Référence à EmailService (selon diagramme UML)
    private String emailServiceId;  // Référence à EmailServiceEntity

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Méthode selon le diagramme :
    // +envoyer(): void
    // Cette méthode sera implémentée dans le service

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dateEnvoie == null) {
            dateEnvoie = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

