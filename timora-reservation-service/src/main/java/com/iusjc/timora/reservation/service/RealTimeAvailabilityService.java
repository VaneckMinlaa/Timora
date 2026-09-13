package com.iusjc.timora.reservation.service;

import com.iusjc.timora.reservation.client.RoomServiceClient;
import com.iusjc.timora.reservation.dto.ReservationConflictDTO;
import com.iusjc.timora.reservation.dto.RoomAvailabilityDTO;
import com.iusjc.timora.reservation.entity.DemandeDeReservation;
import com.iusjc.timora.reservation.entity.StatutReservation;
import com.iusjc.timora.reservation.repository.DemandeDeReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service pour la vérification de disponibilité en temps réel
 * Utilise un cache en mémoire pour optimiser les performances
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RealTimeAvailabilityService {

    private final DemandeDeReservationRepository reservationRepository;
    private final RoomServiceClient roomServiceClient;

    // Cache en mémoire pour la disponibilité (clé: roomId_date_startTime_endTime)
    private final Map<String, RoomAvailabilityDTO> availabilityCache = new ConcurrentHashMap<>();
    
    // Cache pour les informations des salles (clé: roomId)
    private final Map<String, Map<String, Object>> roomInfoCache = new ConcurrentHashMap<>();
    
    // Durée de vie du cache en millisecondes (5 minutes par défaut)
    private static final long CACHE_TTL_MS = 5 * 60 * 1000;

    /**
     * Vérifie la disponibilité en temps réel d'une salle pour une période donnée
     * 
     * @param roomId ID de la salle
     * @param date Date de la réservation
     * @param startTime Heure de début
     * @param endTime Heure de fin
     * @return DTO avec les informations de disponibilité
     */
    public RoomAvailabilityDTO checkRealTimeAvailability(
            String roomId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime) {
        
        String cacheKey = buildCacheKey(roomId, date, startTime, endTime);
        
        // Vérifier le cache
        RoomAvailabilityDTO cached = availabilityCache.get(cacheKey);
        if (cached != null && isCacheValid(cached)) {
            log.debug("Retour de la disponibilité depuis le cache pour {}", cacheKey);
            return cached;
        }
        
        // Calculer la disponibilité en temps réel
        RoomAvailabilityDTO availability = calculateAvailability(roomId, date, startTime, endTime);
        
        // Mettre à jour le cache
        availabilityCache.put(cacheKey, availability);
        
        log.info("Disponibilité calculée en temps réel pour salle {} à {} entre {} et {}: {}",
                roomId, date, startTime, endTime, availability.getAvailable());
        
        return availability;
    }

    /**
     * Obtient la disponibilité en temps réel de toutes les salles pour une période donnée
     * 
     * @param date Date de la réservation
     * @param startTime Heure de début
     * @param endTime Heure de fin
     * @return Liste de disponibilités pour toutes les salles
     */
    public List<RoomAvailabilityDTO> getAllRoomsRealTimeAvailability(
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime) {
        
        log.info("Récupération de la disponibilité en temps réel de toutes les salles pour {} entre {} et {}",
                date, startTime, endTime);
        
        try {
            // Récupérer toutes les salles depuis le Room Service
            List<Map<String, Object>> allRooms = roomServiceClient.getAllRooms(null, null);
            
            if (allRooms == null || allRooms.isEmpty()) {
                log.warn("Aucune salle trouvée dans le Room Service");
                return Collections.emptyList();
            }
            
            // Calculer la disponibilité pour chaque salle en parallèle
            return allRooms.parallelStream()
                    .map(room -> {
                        String roomId = (String) (room.get("idSalle") != null ? room.get("idSalle") : room.get("id"));
                        if (roomId == null) {
                            return null;
                        }
                        return checkRealTimeAvailability(roomId, date, startTime, endTime);
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de la disponibilité de toutes les salles: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Obtient la disponibilité en temps réel d'une salle pour une journée complète
     * Retourne les créneaux disponibles et occupés
     * 
     * @param roomId ID de la salle
     * @param date Date
     * @return Liste de disponibilités par créneau horaire
     */
    public List<RoomAvailabilityDTO> getRoomAvailabilityForDay(String roomId, LocalDate date) {
        log.info("Récupération de la disponibilité en temps réel de la salle {} pour la journée {}", roomId, date);
        
        List<RoomAvailabilityDTO> availabilities = new ArrayList<>();
        
        // Créneaux horaires standards (8h-18h par créneaux de 1h)
        LocalTime start = LocalTime.of(8, 0);
        LocalTime end = LocalTime.of(18, 0);
        
        LocalTime current = start;
        while (current.isBefore(end)) {
            LocalTime slotEnd = current.plusHours(1);
            if (slotEnd.isAfter(end)) {
                slotEnd = end;
            }
            
            RoomAvailabilityDTO availability = checkRealTimeAvailability(roomId, date, current, slotEnd);
            availabilities.add(availability);
            
            current = slotEnd;
        }
        
        return availabilities;
    }

    /**
     * Invalide le cache pour une salle spécifique
     * Appelé automatiquement lors de la création/modification/suppression d'une réservation
     * 
     * @param roomId ID de la salle
     * @param date Date
     */
    @Async
    public void invalidateCache(String roomId, LocalDate date) {
        log.info("Invalidation du cache pour la salle {} à la date {}", roomId, date);
        
        // Supprimer toutes les entrées du cache pour cette salle et cette date
        availabilityCache.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            return key.startsWith(roomId + "_" + date.toString());
        });
        
        log.debug("Cache invalidé pour {} entrées", roomId);
    }

    /**
     * Invalide tout le cache
     */
    public void invalidateAllCache() {
        log.info("Invalidation de tout le cache de disponibilité");
        availabilityCache.clear();
        roomInfoCache.clear();
    }

    /**
     * Calcule la disponibilité réelle d'une salle
     */
    private RoomAvailabilityDTO calculateAvailability(
            String roomId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime) {
        
        // Récupérer les informations de la salle (avec cache)
        Map<String, Object> room = getRoomInfo(roomId);
        String roomName = room != null && !room.isEmpty() ?
                (String) room.getOrDefault("nomsalle", "Salle inconnue") : "Salle inconnue";
        
        // Vérifier les conflits de réservation (les annulées sont déjà exclues par la requête)
        List<DemandeDeReservation> activeConflicts = reservationRepository.findConflictingReservations(
                roomId, date, startTime, endTime, StatutReservation.ANNULEE);
        
        boolean available = activeConflicts.isEmpty();
        
        // Mapper les conflits en DTOs
        List<ReservationConflictDTO> conflictDTOs = activeConflicts.stream()
                .map(this::mapToConflictDTO)
                .collect(Collectors.toList());
        
        return RoomAvailabilityDTO.builder()
                .roomId(roomId)
                .roomName(roomName)
                .available(available)
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .conflicts(conflictDTOs)
                .lastUpdated(System.currentTimeMillis())
                .build();
    }

    /**
     * Récupère les informations d'une salle avec cache
     */
    private Map<String, Object> getRoomInfo(String roomId) {
        // Vérifier le cache
        Map<String, Object> cached = roomInfoCache.get(roomId);
        if (cached != null) {
            return cached;
        }
        
        // Récupérer depuis le service
        try {
            Map<String, Object> room = roomServiceClient.getRoomById(roomId);
            if (room != null && !room.isEmpty()) {
                roomInfoCache.put(roomId, room);
            }
            return room;
        } catch (Exception e) {
            log.warn("Erreur lors de la récupération des informations de la salle {}: {}", roomId, e.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Mappe une réservation en DTO de conflit
     */
    private ReservationConflictDTO mapToConflictDTO(DemandeDeReservation reservation) {
        return ReservationConflictDTO.builder()
                .reservationId(reservation.getIdDemandeReservation())
                .date(reservation.getDate())
                .startTime(reservation.getHeuredebut())
                .endTime(reservation.getHeureFin())
                .status(reservation.getStatut().name())
                .purpose(reservation.getPurpose())
                .build();
    }

    /**
     * Construit une clé de cache
     */
    private String buildCacheKey(String roomId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        return String.format("%s_%s_%s_%s", roomId, date, startTime, endTime);
    }

    /**
     * Vérifie si le cache est encore valide
     */
    private boolean isCacheValid(RoomAvailabilityDTO cached) {
        if (cached.getLastUpdated() == null) {
            return false;
        }
        long age = System.currentTimeMillis() - cached.getLastUpdated();
        return age < CACHE_TTL_MS;
    }

    /**
     * Nettoie le cache expiré (peut être appelé périodiquement)
     */
    public void cleanExpiredCache() {
        long now = System.currentTimeMillis();
        int removed = 0;
        
        Iterator<Map.Entry<String, RoomAvailabilityDTO>> iterator = availabilityCache.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, RoomAvailabilityDTO> entry = iterator.next();
            RoomAvailabilityDTO value = entry.getValue();
            if (value.getLastUpdated() != null) {
                long age = now - value.getLastUpdated();
                if (age >= CACHE_TTL_MS) {
                    iterator.remove();
                    removed++;
                }
            }
        }
        
        if (removed > 0) {
            log.debug("Nettoyage du cache: {} entrées expirées supprimées", removed);
        }
    }
}
