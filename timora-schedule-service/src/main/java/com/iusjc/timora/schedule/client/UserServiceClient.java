package com.iusjc.timora.schedule.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

/**
 * Client Feign pour la communication avec UserService
 */
@FeignClient(
    name = "TIMORA-USER-SERVICE",
    path = "/api/users"
)
public interface UserServiceClient {

    /**
     * Récupère un utilisateur par ID
     */
    @GetMapping("/{id}")
    Map<String, Object> getUserById(@PathVariable("id") String userId);

    /**
     * Récupère tous les étudiants par filière
     */
    @GetMapping("/role/ETUDIANT")
    List<Map<String, Object>> getStudentsByFiliere(
            @RequestParam(value = "filiereId", required = false) String filiereId,
            @RequestParam(value = "niveau", required = false) String niveau,
            @RequestParam(value = "ecoleId", required = false) String ecoleId);

    /**
     * Récupère un enseignant par ID
     */
    @GetMapping("/{id}")
    Map<String, Object> getTeacherById(@PathVariable("id") String teacherId);
}
