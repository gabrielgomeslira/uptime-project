package com.uptime.monitor.dto;

import com.uptime.monitor.model.CheckResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Optional;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
public class MonitorStats {
    private Long monitorId;
    private String monitorName;
    private String url;
    private Boolean lastCheckSuccess;
    private Integer lastResponseTime;
    private LocalDateTime lastCheckedAt;
    private Long totalChecks;
    private Long successfulChecks;
    private Double uptimePercentage;
    private Double averageResponseTime;
    
    public static MonitorStats fromLastCheckResult(CheckResult result, Long totalChecks, Long successfulChecks, Double averageResponseTime) {
        try {
            if (result == null) {
                log.warn("Tentativa de criar estatísticas a partir de um resultado nulo");
                return null;
            }
            
            if (result.getMonitor() == null) {
                log.warn("CheckResult tem referência nula para monitor");
                return null;
            }
            
            Double uptime = 0.0;
            if (totalChecks != null && totalChecks > 0 && successfulChecks != null) {
                uptime = (successfulChecks.doubleValue() / totalChecks.doubleValue()) * 100.0;
            }
            
            return MonitorStats.builder()
                    .monitorId(result.getMonitor().getId())
                    .monitorName(result.getMonitor().getName())
                    .url(result.getMonitor().getUrl())
                    .lastCheckSuccess(result.getSuccess() != null ? result.getSuccess() : false)
                    .lastResponseTime(result.getResponseTime() != null ? result.getResponseTime() : 0)
                    .lastCheckedAt(result.getCheckedAt())
                    .totalChecks(totalChecks != null ? totalChecks : 0L)
                    .successfulChecks(successfulChecks != null ? successfulChecks : 0L)
                    .uptimePercentage(uptime)
                    .averageResponseTime(averageResponseTime != null ? averageResponseTime : 0.0)
                    .build();
        } catch (Exception e) {
            log.error("Erro ao criar estatísticas a partir de resultado: {}", e.getMessage(), e);
            return null;
        }
    }
} 