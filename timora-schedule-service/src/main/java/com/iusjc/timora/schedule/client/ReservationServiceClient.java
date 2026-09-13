package com.iusjc.timora.schedule.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(
    name = "TIMORA-RESERVATION-SERVICE",
    path = "/api/reservations/disponibilites"
)
public interface ReservationServiceClient {

    @GetMapping("/day/{jour}")
    List<Map<String, Object>> getDisponibilitesByDay(@PathVariable("jour") String jour);
    
    @GetMapping("/user/{userId}")
    List<Map<String, Object>> getDisponibilitesByUserId(@PathVariable("userId") String userId);
}
