package com.uptime.monitor.controller;

import com.uptime.monitor.dto.MonitorStats;
import com.uptime.monitor.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatisticsController {

    private final StatisticsService statisticsService;
    
    @GetMapping
    public ResponseEntity<List<MonitorStats>> getAllMonitorStats() {
        return ResponseEntity.ok(statisticsService.getStatsForAllMonitors());
    }
    
    @GetMapping("/monitor/{monitorId}")
    public ResponseEntity<MonitorStats> getMonitorStats(@PathVariable Long monitorId) {
        MonitorStats stats = statisticsService.getStatsForMonitorId(monitorId);
        return stats != null ? ResponseEntity.ok(stats) : ResponseEntity.notFound().build();
    }
} 