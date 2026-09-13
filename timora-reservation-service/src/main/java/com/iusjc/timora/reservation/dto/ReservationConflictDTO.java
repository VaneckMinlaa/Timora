package com.iusjc.timora.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO pour représenter un conflit de réservation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationConflictDTO {
    private String reservationId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String purpose;
}
