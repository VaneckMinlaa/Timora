package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.ResolutionFeasibility;
import com.iusjc.timora.schedule.entity.ResolutionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolutionResponse {
    private String id;
    private ResolutionType type;
    private String description;
    private String explanation;
    private Integer priority;
    private ResolutionFeasibility feasibility;
    private String impact;
    private Map<String, String> changes;
}
