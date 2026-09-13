package com.iusjc.timora.reservation.config;

import com.iusjc.timora.reservation.service.RealTimeAvailabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler pour nettoyer périodiquement le cache de disponibilité
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CacheScheduler {

    private final RealTimeAvailabilityService realTimeAvailabilityService;

    /**
     * Nettoie le cache expiré toutes les 10 minutes
     */
    @Scheduled(fixedRate = 600000) // 10 minutes
    public void cleanExpiredCache() {
        log.debug("Nettoyage périodique du cache de disponibilité");
        realTimeAvailabilityService.cleanExpiredCache();
    }
}
