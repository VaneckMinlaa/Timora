package com.iusjc.timora.schedule.dto;

import com.iusjc.timora.schedule.entity.TypeCours;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AffectedCourseResponse {
    private String id;
    private String name;
    private TypeCours type;
    private String teacherId;
    private String teacherName;
    private String roomId;
    private String roomName;
    private LocalTime startTime;
    private LocalTime endTime;
    private List<String> classNames;
    private String dayOfWeek;
}
