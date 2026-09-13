package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.ConflictSeverity;
import com.iusjc.timora.schedule.entity.ConflictStatus;
import com.iusjc.timora.schedule.entity.ConflictType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConflictResponse {
    private String id;
    private ConflictType type;
    private ConflictSeverity severity;
    private ConflictStatus status;
    private String title;
    private String description;
    
    private List<String> affectedCoursIds;
    
    // Détails spécifiques
    private String roomId;
    private String roomName;
    private String teacherId;
    private String teacherName;
    private String classeId;
    private String className;
    
    // Informations temporelles
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDate conflictDate;
    
    // Métadonnées
    private LocalDateTime detectedAt;
    private LocalDateTime resolvedAt;
    private String resolvedBy;
    private LocalDateTime updatedAt;
}
