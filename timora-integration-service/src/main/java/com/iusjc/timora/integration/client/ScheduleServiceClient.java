package com.iusjc.timora.integration.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Client Feign pour la communication interne avec ScheduleService
 */
@FeignClient(name = "TIMORA-SCHEDULE-SERVICE", path = "/api/schedules")
public interface ScheduleServiceClient {

    /**
     * Récupère un emploi du temps par ID
     */
    @GetMapping("/{id}")
    Map<String, Object> getSchedule(@PathVariable("id") String id);

    /**
     * Synchronise les données avec le système externe (Agora/ENT)
     */
    @PostMapping("/sync")
    Map<String, Object> synchronizeSchedule(@RequestBody Map<String, Object> scheduleData);
}

