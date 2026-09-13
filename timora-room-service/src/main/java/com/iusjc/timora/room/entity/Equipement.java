package com.iusjc.timora.room.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "equipements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_equip")
    private String idEquip;  

    @Column(nullable = false)
    private String nom;

    @Column(nullable = true)
    private String categorie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EtatEquipement statut;  

    @Column(nullable = true)
    private String salleId; 

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

