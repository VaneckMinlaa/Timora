package com.iusjc.timora.reporting.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité Logger 
 * Permet d'enregistrer les logs du système dans la base de données
 */
@Entity
@Table(name = "logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Logger {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NiveauLog niveauLog;  

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;  

    @Column(nullable = false)
    private LocalDateTime dateLog;  

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dateLog == null) {
            dateLog = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Enum NiveauLog 
     */
    public enum NiveauLog {
        DEBUG,
        INFO,
        WARN,
        ERROR,
        FATAL
    }
}

