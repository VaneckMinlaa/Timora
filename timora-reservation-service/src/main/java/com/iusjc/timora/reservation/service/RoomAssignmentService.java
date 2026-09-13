package com.iusjc.timora.reservation.service;

import com.iusjc.timora.reservation.client.RoomServiceClient;
import com.iusjc.timora.reservation.dto.RoomSuggestionResponse;
import com.iusjc.timora.reservation.repository.DemandeDeReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service pour l'assignation automatique des salles
 * Assigne automatiquement une salle en fonction du type de cours et de la taille du groupe
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoomAssignmentService {

    private final RoomServiceClient roomServiceClient;
    private final DemandeDeReservationRepository reservationRepository;

    /**
     * Enum pour les types de cours (copié depuis Schedule Service pour éviter la dépendance)
     */
    public enum TypeCours {
        COURS_MAGISTRAL,  
        TD,              
        TP,              
        EXAMEN          
    }

    /**
     * Enum pour les types de salles (copié depuis Room Service pour éviter la dépendance)
     */
    public enum TypeSalle {
        AMPHI,          
        TD,             
        LABORATOIRE,    
        COURS           
    }

    /**
     * Suggère des salles appropriées en fonction du type de cours et de la taille du groupe
     * 
     * @param typeCours 
     * @param numberOfParticipants 
     * @param date 
     * @param heureDebut 
     * @param heureFin 
     * @return Liste de suggestions de salles triées par pertinence
     */
    public List<RoomSuggestionResponse> suggestRooms(
            String typeCours,
            Integer numberOfParticipants,
            LocalDate date,
            LocalTime heureDebut,
            LocalTime heureFin) {
        
        log.info("Suggestion de salles pour typeCours={}, numberOfParticipants={}, date={}, heure={}-{}",
                typeCours, numberOfParticipants, date, heureDebut, heureFin);

        // Déterminer le type de salle approprié
        TypeSalle targetRoomType = mapCourseTypeToRoomType(typeCours);
        
        // Déterminer la capacité minimale requise
        int minCapacity = numberOfParticipants != null ? numberOfParticipants : 1;
        
        // Récupérer toutes les salles disponibles (via le client)
        // Note: On doit appeler le Room Service pour obtenir les salles
        // Pour l'instant, on va utiliser une approche où on filtre côté client
        // Dans une vraie implémentation, on devrait avoir un endpoint dans RoomService
        // qui retourne les salles filtrées par type et capacité
        
        List<RoomSuggestionResponse> suggestions = new ArrayList<>();
        
        // Pour chaque type de salle possible (en commençant par le plus approprié)
        List<TypeSalle> roomTypesToTry = getRoomTypesByPriority(targetRoomType, minCapacity);
        
        for (TypeSalle roomType : roomTypesToTry) {
            try {
                // Récupérer les salles de ce type via le Room Service
                List<Map<String, Object>> availableRooms = getAvailableRoomsByTypeAndCapacity(
                        roomType, minCapacity, date, heureDebut, heureFin);
                
                log.debug("Trouvé {} salles de type {} avec capacité >= {}", 
                        availableRooms.size(), roomType, minCapacity);
                
                for (Map<String, Object> room : availableRooms) {
                    RoomSuggestionResponse suggestion = mapToSuggestion(room, roomType, minCapacity);
                    if (suggestion != null) {
                        suggestions.add(suggestion);
                        log.debug("Suggestion ajoutée: {} (type: {}, capacité: {})", 
                                suggestion.getRoomName(), roomType, suggestion.getCapacity());
                    }
                }
                
                // Si on a trouvé des suggestions du type préféré, continuer quand même
                // pour avoir plus d'options, mais on peut limiter le nombre total
                if (suggestions.size() >= 10) {
                    log.debug("Limite de suggestions atteinte (10), arrêt de la recherche");
                    break;
                }
            } catch (Exception e) {
                log.warn("Erreur lors de la récupération des salles de type {}: {}", roomType, e.getMessage());
            }
        }
        
        // Trier par pertinence (capacité la plus proche du nombre de participants)
        suggestions.sort((a, b) -> {
            int diffA = Math.abs((a.getCapacity() != null ? a.getCapacity() : 0) - minCapacity);
            int diffB = Math.abs((b.getCapacity() != null ? b.getCapacity() : 0) - minCapacity);
            return Integer.compare(diffA, diffB);
        });
        
        log.info("Trouvé {} suggestions de salles", suggestions.size());
        return suggestions;
    }

    /**
     * Assigne automatiquement la meilleure salle disponible
     * 
     * @param typeCours 
     * @param numberOfParticipants 
     * @param date 
     * @param heureDebut 
     * @param heureFin 
     * @return 
     */
    public String autoAssignRoom(
            String typeCours,
            Integer numberOfParticipants,
            LocalDate date,
            LocalTime heureDebut,
            LocalTime heureFin) {
        
        List<RoomSuggestionResponse> suggestions = suggestRooms(
                typeCours, numberOfParticipants, date, heureDebut, heureFin);
        
        if (suggestions.isEmpty()) {
            log.warn("Aucune salle disponible pour typeCours={}, numberOfParticipants={}", 
                    typeCours, numberOfParticipants);
            return null;
        }
        
        // Retourner la première suggestion (la plus pertinente)
        String roomId = suggestions.get(0).getRoomId();
        log.info("Salle automatiquement assignée: {}", roomId);
        return roomId;
    }

    /**
     * Mappe le type de cours vers le type de salle approprié
     */
    private TypeSalle mapCourseTypeToRoomType(String typeCours) {
        if (typeCours == null) {
            return TypeSalle.COURS; // Par défaut
        }
        
        try {
            TypeCours courseType = TypeCours.valueOf(typeCours.toUpperCase());
            switch (courseType) {
                case COURS_MAGISTRAL:
                    return TypeSalle.AMPHI; // Amphithéâtre pour les conférences
                case TD:
                    // Pour les TD, on peut utiliser TD ou COURS
                    return TypeSalle.TD; // Salle de TD en priorité
                case TP:
                    return TypeSalle.LABORATOIRE; // Laboratoire pour les expériences
                case EXAMEN:
                    // Pour les examens, on peut utiliser AMPHI ou COURS selon la taille
                    return TypeSalle.AMPHI; // Par défaut, amphithéâtre
                default:
                    return TypeSalle.COURS;
            }
        } catch (IllegalArgumentException e) {
            log.warn("Type de cours inconnu: {}, utilisation du type par défaut", typeCours);
            return TypeSalle.COURS;
        }
    }

    /**
     * Retourne la liste des types de salles à essayer par ordre de priorité
     */
    private List<TypeSalle> getRoomTypesByPriority(TypeSalle preferredType, int minCapacity) {
        List<TypeSalle> types = new ArrayList<>();
        types.add(preferredType);
        
        // Si la capacité est grande, on peut aussi essayer d'autres types
        if (minCapacity > 50 && preferredType != TypeSalle.AMPHI) {
            types.add(TypeSalle.AMPHI);
        }
        
        // Ajouter COURS comme alternative si ce n'est pas déjà le type préféré
        // COURS est un type polyvalent qui peut être utilisé pour tous les types de cours
        if (preferredType != TypeSalle.COURS) {
            types.add(TypeSalle.COURS);
        }
        
        // Ajouter TD comme alternative pour les petits groupes si ce n'est pas déjà inclus
        if (minCapacity <= 30 && preferredType != TypeSalle.TD && preferredType != TypeSalle.COURS) {
            types.add(TypeSalle.TD);
        }
        
        return types;
    }

    /**
     * Récupère les salles disponibles par type et capacité
     */
    private List<Map<String, Object>> getAvailableRoomsByTypeAndCapacity(
            TypeSalle roomType,
            int minCapacity,
            LocalDate date,
            LocalTime heureDebut,
            LocalTime heureFin) {
        
        try {
            // Appeler le Room Service pour récupérer les salles filtrées
            List<Map<String, Object>> allRooms = roomServiceClient.getAllRooms(
                    roomType.name(), // Type de salle
                    minCapacity      // Capacité minimale
            );
            
            if (allRooms == null || allRooms.isEmpty()) {
                log.debug("Aucune salle trouvée pour type={}, capacité min={}", roomType, minCapacity);
                return new ArrayList<>();
            }
            
            // Filtrer les salles disponibles (pas de conflit de réservation)
            return allRooms.stream()
                    .filter(room -> {
                        String roomId = (String) (room.get("idSalle") != null ? room.get("idSalle") : room.get("id"));
                        if (roomId == null) {
                            return false;
                        }
                        return isRoomAvailable(roomId, date, heureDebut, heureFin);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des salles depuis Room Service: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Vérifie si une salle est disponible à la date et heure données
     */
    private boolean isRoomAvailable(String roomId, LocalDate date, LocalTime heureDebut, LocalTime heureFin) {
        List<com.iusjc.timora.reservation.entity.DemandeDeReservation> conflicts = 
                reservationRepository.findConflictingReservations(roomId, date, heureDebut, heureFin,
                        com.iusjc.timora.reservation.entity.StatutReservation.ANNULEE);
        return conflicts.isEmpty();
    }

    /**
     * Mappe une salle (Map) vers une suggestion
     */
    private RoomSuggestionResponse mapToSuggestion(
            Map<String, Object> room,
            TypeSalle roomType,
            int minCapacity) {
        
        try {
            String roomId = (String) (room.get("idSalle") != null ? room.get("idSalle") : room.get("id"));
            String roomName = (String) (room.get("nomsalle") != null ? room.get("nomsalle") : room.get("name"));
            Integer capacity = null;
            
            if (room.get("capacite") != null) {
                capacity = ((Number) room.get("capacite")).intValue();
            } else if (room.get("capacity") != null) {
                capacity = ((Number) room.get("capacity")).intValue();
            }
            
            if (roomId == null || roomName == null) {
                return null;
            }
            
            // Ne pas exclure les salles avec capacité insuffisante, mais les marquer comme non adaptées
            // Cela permet à l'utilisateur de voir toutes les options disponibles
            boolean suitable = capacity != null && capacity >= minCapacity;
            
            return RoomSuggestionResponse.builder()
                    .roomId(roomId)
                    .roomName(roomName)
                    .roomType(roomType.name())
                    .capacity(capacity != null ? capacity : 0)
                    .suitable(suitable)
                    .build();
        } catch (Exception e) {
            log.warn("Erreur lors du mapping de la salle: {}", e.getMessage());
            return null;
        }
    }
}
