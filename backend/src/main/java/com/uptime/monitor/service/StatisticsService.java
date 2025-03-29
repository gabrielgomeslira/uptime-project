package com.uptime.monitor.service;

import com.uptime.monitor.dto.MonitorStats;
import com.uptime.monitor.model.CheckResult;
import com.uptime.monitor.model.Monitor;
import com.uptime.monitor.repository.CheckResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {

    private final MonitorService monitorService;
    private final CheckResultService checkResultService;
    private final CheckResultRepository checkResultRepository;

    public List<MonitorStats> getStatsForAllMonitors() {
        List<Monitor> monitors = monitorService.getAllMonitors();
        List<MonitorStats> statsList = new ArrayList<>();
        
        for (Monitor monitor : monitors) {
            try {
                MonitorStats stats = getStatsForMonitor(monitor);
                if (stats != null) {
                    statsList.add(stats);
                }
            } catch (Exception e) {
                log.error("Erro ao calcular estatísticas para o monitor {}: {}", monitor.getId(), e.getMessage());
            }
        }
        
        return statsList;
    }
    
    public MonitorStats getStatsForMonitor(Monitor monitor) {
        if (monitor == null) {
            log.warn("Tentativa de obter estatísticas para um monitor nulo");
            return null;
        }
        
        List<CheckResult> results = checkResultService.getResultsByMonitorId(monitor.getId());
        
        if (results.isEmpty()) {
            return createEmptyStats(monitor);
        }
        
        CheckResult latestResult = results.get(0);
        long totalChecks = results.size();
        long successfulChecks = results.stream().filter(CheckResult::getSuccess).count();
        
        double averageResponseTime = results.stream()
                .mapToInt(CheckResult::getResponseTime)
                .average()
                .orElse(0);
        
        return MonitorStats.fromLastCheckResult(latestResult, totalChecks, successfulChecks, averageResponseTime);
    }
    
    private MonitorStats createEmptyStats(Monitor monitor) {
        return MonitorStats.builder()
                .monitorId(monitor.getId())
                .monitorName(monitor.getName())
                .url(monitor.getUrl())
                .lastCheckSuccess(false)
                .lastResponseTime(0)
                .lastCheckedAt(null)
                .totalChecks(0L)
                .successfulChecks(0L)
                .uptimePercentage(0.0)
                .averageResponseTime(0.0)
                .build();
    }
    
    public MonitorStats getStatsForMonitorId(Long monitorId) {
        return monitorService.getMonitorById(monitorId)
                .map(this::getStatsForMonitor)
                .orElse(null);
    }
} 