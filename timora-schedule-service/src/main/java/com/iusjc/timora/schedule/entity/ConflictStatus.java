package com.iusjc.timora.schedule.entity;

/**
 * Statuts possibles d'un conflit
 */
public enum ConflictStatus {
    PENDING,    // En attente de résolution
    RESOLVED,   // Résolu
    IGNORED     // Ignoré volontairement
}
