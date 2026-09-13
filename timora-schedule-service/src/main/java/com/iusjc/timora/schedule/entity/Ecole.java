package com.iusjc.timora.schedule.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité Ecole 
 */
@Entity
@Table(name = "ecoles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ecole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_ecole", length = 36)
    private String idEcole;  

    @Column(nullable = false)
    private String nomEcole;  

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

