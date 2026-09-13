package com.iusjc.timora.auth.client;

import com.iusjc.timora.auth.dto.SendResetCodeRequest;
import com.iusjc.timora.auth.dto.SendNewPasswordRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Client Feign pour communiquer avec le service de notification
 */
@FeignClient(
    name = "TIMORA-NOTIFICATION-SERVICE",
    fallback = NotificationServiceClientFallback.class
)
public interface NotificationServiceClient {

    /**
     * Envoie un email avec le code de réinitialisation
     */
    @PostMapping("/api/notifications/send-reset-code")
    void sendResetCode(@RequestBody SendResetCodeRequest request);

    /**
     * Envoie un email avec le nouveau mot de passe
     */
    @PostMapping("/api/notifications/send-new-password")
    void sendNewPassword(@RequestBody SendNewPasswordRequest request);
}
