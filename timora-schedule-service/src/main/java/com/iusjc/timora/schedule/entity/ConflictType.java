package com.iusjc.timora.schedule.entity;

/**
 * Types de conflits possibles
 */
public enum ConflictType {
    TEACHER_OVERLAP,        // Enseignant programmé dans plusieurs cours simultanément
    ROOM_OVERLAP,           // Salle occupée par plusieurs cours simultanément
    STUDENT_GROUP_OVERLAP,  // Groupe d'étudiants a plusieurs cours en même temps
    ROOM_CAPACITY,          // Capacité de la salle insuffisante
    EQUIPMENT_MISSING,      // Équipement requis manquant dans la salle
    TEACHER_UNAVAILABLE,    // Cours programmé hors disponibilités de l'enseignant
    TIME_OVERFLOW           // Cours dépasse les horaires autorisés
}
