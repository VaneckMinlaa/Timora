package com.iusjc.timora.auth.client;

import com.iusjc.timora.auth.dto.SendResetCodeRequest;
import com.iusjc.timora.auth.dto.SendNewPasswordRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Fallback pour le client Feign du service de notification
 */
@Component
@Slf4j
public class NotificationServiceClientFallback implements NotificationServiceClient {

    @Override
    public void sendResetCode(SendResetCodeRequest request) {
        log.error("FALLBACK: Impossible d'envoyer le code de réinitialisation à {}. Le service de notification est indisponible.", request.getTo());
    }

    @Override
    public void sendNewPassword(SendNewPasswordRequest request) {
        log.error("FALLBACK: Impossible d'envoyer le nouveau mot de passe à {}. Le service de notification est indisponible.", request.getTo());
    }
}
