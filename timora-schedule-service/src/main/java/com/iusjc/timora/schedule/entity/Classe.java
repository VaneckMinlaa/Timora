package com.iusjc.timora.schedule.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité Classe
 */
@Entity
@Table(name = "classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Classe {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_classe", length = 36)
    private String idClasse; 

    @Column(nullable = false)
    private String nom; 

    @Column(nullable = false)
    private Integer effectif;  

    // Références aux autres entités
    @Column(nullable = false)
    private String filiereId;  

    @Column(nullable = false)
    private String ecoleId;  

    @Column(nullable = false)
    private String niveau; 

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

