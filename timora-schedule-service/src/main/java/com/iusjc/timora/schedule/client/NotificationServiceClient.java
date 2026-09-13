package com.iusjc.timora.schedule.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Client Feign pour la communication avec NotificationService
 */
@FeignClient(
    name = "TIMORA-NOTIFICATION-SERVICE",
    path = "/api/notifications"
)
public interface NotificationServiceClient {

    /**
     * Envoie un email de notification
     */
    @PostMapping("/email")
    Map<String, Object> sendEmail(@RequestBody Map<String, Object> emailRequest);

    /**
     * Envoie une notification d'emploi du temps
     */
    @PostMapping("/email/schedule")
    void sendScheduleNotification(@RequestBody java.util.Map<String, Object> request);

    /**
     * Envoie un SMS de notification
     */
    @PostMapping("/sms")
    Map<String, Object> sendSms(@RequestBody Map<String, Object> smsRequest);
}
