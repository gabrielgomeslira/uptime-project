package com.uptime.monitor.repository;

import com.uptime.monitor.model.Monitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonitorRepository extends JpaRepository<Monitor, Long> {
    List<Monitor> findByActive(boolean active);
} 