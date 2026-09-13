package com.iusjc.timora.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConflictDetailsResponse {
    private ConflictResponse conflict;
    private List<AffectedCourseResponse> affectedCourses;
    private List<ResolutionResponse> suggestedSolutions;
}
