package com.iusjc.timora.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour les statistiques des utilisateurs
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatisticsResponse {

    private Long totalUsers;
    private Long activeUsers;
    private Long admins;
    private Long managers;  
    private Long regularUsers; 
    
    // Getters pour compatibilité
    public Long getTeachers() {
        return regularUsers;
    }
}

