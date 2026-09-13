package com.iusjc.timora.schedule.repository;

import com.iusjc.timora.schedule.entity.ConflictResolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConflictResolutionRepository extends JpaRepository<ConflictResolution, String> {

    List<ConflictResolution> findByConflictId(String conflictId);

    List<ConflictResolution> findByConflictIdOrderByPriorityDesc(String conflictId);

    void deleteByConflictId(String conflictId);
}
