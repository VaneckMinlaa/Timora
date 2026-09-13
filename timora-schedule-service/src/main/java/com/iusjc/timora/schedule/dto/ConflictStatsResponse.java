package com.iusjc.timora.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConflictStatsResponse {
    private Long totalConflicts;
    private Long pendingConflicts;
    private Long resolvedConflicts;
    private Long ignoredConflicts;
    private Long resolvedThisWeek;
    private Long detectedThisWeek;
    private Map<String, Long> conflictsByType;
    private Map<String, Long> conflictsBySeverity;
}
