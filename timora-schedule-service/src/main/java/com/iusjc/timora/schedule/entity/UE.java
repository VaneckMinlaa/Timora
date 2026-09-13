package com.iusjc.timora.schedule.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité UE 
 */
@Entity
@Table(name = "ues")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UE {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_ue", length = 36)
    private String idUE;  

    @Column(nullable = false, unique = true)
    private String codeUE; 

    @Column(nullable = false)
    private String nomUE;  

    private String description;  

    @Column(nullable = false)
    private Integer nombreCredit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private Semestre semestre;

    @Column(nullable = false)
    private String filiereId;

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

