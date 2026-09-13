package com.iusjc.timora.schedule.repository;

import com.iusjc.timora.schedule.entity.Conflict;
import com.iusjc.timora.schedule.entity.ConflictStatus;
import com.iusjc.timora.schedule.entity.ConflictType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConflictRepository extends JpaRepository<Conflict, String> {

    List<Conflict> findByStatus(ConflictStatus status);

    List<Conflict> findByType(ConflictType type);

    List<Conflict> findByStatusAndType(ConflictStatus status, ConflictType type);

    @Query("SELECT c FROM Conflict c WHERE c.detectedAt BETWEEN :startDate AND :endDate")
    List<Conflict> findByDetectedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                           @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c FROM Conflict c WHERE c.status = :status AND c.detectedAt BETWEEN :startDate AND :endDate")
    List<Conflict> findByStatusAndDetectedAtBetween(@Param("status") ConflictStatus status,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);

    List<Conflict> findByTeacherId(String teacherId);

    List<Conflict> findByRoomId(String roomId);

    List<Conflict> findByClasseId(String classeId);

    @Query("SELECT COUNT(c) FROM Conflict c WHERE c.status = :status AND c.detectedAt >= :startDate")
    Long countByStatusSince(@Param("status") ConflictStatus status, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT c FROM Conflict c WHERE :coursId MEMBER OF c.affectedCoursIds")
    List<Conflict> findByAffectedCoursId(@Param("coursId") String coursId);
}
