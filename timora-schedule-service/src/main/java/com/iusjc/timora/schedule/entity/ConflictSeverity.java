package com.iusjc.timora.schedule.entity;

/**
 * Niveaux de sévérité des conflits
 */
public enum ConflictSeverity {
    CRITICAL,   // Bloquant - doit être résolu immédiatement
    HIGH,       // Important - à résoudre rapidement
    MEDIUM,     // Moyen - peut attendre
    LOW         // Faible - information
}
