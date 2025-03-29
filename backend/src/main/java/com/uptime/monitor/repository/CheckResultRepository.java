package com.uptime.monitor.repository;

import com.uptime.monitor.model.CheckResult;
import com.uptime.monitor.model.Monitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CheckResultRepository extends JpaRepository<CheckResult, Long> {
    List<CheckResult> findByMonitorIdOrderByCheckedAtDesc(Long monitorId);
    
    List<CheckResult> findByMonitorIdAndCheckedAtBetweenOrderByCheckedAtDesc(
            Long monitorId, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT cr FROM CheckResult cr WHERE cr.monitor = ?1 ORDER BY cr.checkedAt DESC LIMIT 1")
    CheckResult findLatestByMonitor(Monitor monitor);
} 