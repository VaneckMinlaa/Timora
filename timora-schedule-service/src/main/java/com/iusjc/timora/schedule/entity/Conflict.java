package com.iusjc.timora.schedule.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Conflict - Représente un conflit d'horaire détecté
 */
@Entity
@Table(name = "conflicts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conflict {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConflictType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConflictSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConflictStatus status;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    // IDs des cours affectés
    @ElementCollection
    @CollectionTable(name = "conflict_affected_courses", joinColumns = @JoinColumn(name = "conflict_id"))
    @Column(name = "cours_id")
    @Builder.Default
    private List<String> affectedCoursIds = new ArrayList<>();

    // Détails spécifiques selon le type
    private String roomId;
    private String roomName;
    private String teacherId;
    private String teacherName;
    private String classeId;
    private String className;

    // Informations temporelles
    private String dayOfWeek;
    private java.time.LocalTime startTime;
    private java.time.LocalTime endTime;
    private java.time.LocalDate conflictDate;

    // Métadonnées
    @Column(nullable = false, updatable = false)
    private LocalDateTime detectedAt;

    private LocalDateTime resolvedAt;
    private String resolvedBy;
    private String resolutionNotes;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ConflictStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
