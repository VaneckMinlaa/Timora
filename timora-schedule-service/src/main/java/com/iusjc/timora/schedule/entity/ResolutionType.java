package com.iusjc.timora.schedule.entity;

/**
 * Types de résolution possibles
 */
public enum ResolutionType {
    CHANGE_ROOM,        // Changer de salle
    CHANGE_TIME,        // Changer l'horaire
    SWAP_COURSES,       // Échanger deux cours
    SPLIT_GROUP,        // Diviser le groupe
    CHANGE_TEACHER,     // Changer l'enseignant
    CANCEL_COURSE       // Annuler le cours
}
