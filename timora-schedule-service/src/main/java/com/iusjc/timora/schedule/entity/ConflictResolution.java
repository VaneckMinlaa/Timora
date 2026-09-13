package com.iusjc.timora.schedule.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Entité ConflictResolution - Représente une solution proposée pour un conflit
 */
@Entity
@Table(name = "conflict_resolutions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConflictResolution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String conflictId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResolutionType type;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, length = 1000)
    private String explanation;

    // Score de qualité de la solution (0-100)
    @Column(nullable = false)
    private Integer priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResolutionFeasibility feasibility;

    @Column(length = 500)
    private String impact;

    // Détails des changements proposés (stockés en JSON)
    @ElementCollection
    @CollectionTable(name = "resolution_changes", joinColumns = @JoinColumn(name = "resolution_id"))
    @MapKeyColumn(name = "change_key")
    @Column(name = "change_value", length = 500)
    @Builder.Default
    private Map<String, String> changes = new HashMap<>();

    // Métadonnées
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
