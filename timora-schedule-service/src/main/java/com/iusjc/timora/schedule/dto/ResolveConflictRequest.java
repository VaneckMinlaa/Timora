package com.iusjc.timora.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolveConflictRequest {
    private String resolutionId;
    private String notes;
    private String resolvedBy;
}
