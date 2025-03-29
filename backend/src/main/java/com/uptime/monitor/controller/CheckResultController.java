package com.uptime.monitor.controller;

import com.uptime.monitor.model.CheckResult;
import com.uptime.monitor.service.CheckResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/check-results")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class CheckResultController {
    
    private final CheckResultService checkResultService;
    
    @GetMapping("/monitor/{monitorId}")
    public ResponseEntity<List<CheckResult>> getResultsByMonitorId(@PathVariable Long monitorId) {
        try {
            return ResponseEntity.ok(checkResultService.getResultsByMonitorId(monitorId));
        } catch (Exception e) {
            log.error("Erro ao buscar resultados para o monitor {}: {}", monitorId, e.getMessage(), e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
    
    @GetMapping("/monitor/{monitorId}/time-range")
    public ResponseEntity<List<CheckResult>> getResultsByMonitorIdAndTimeRange(
            @PathVariable Long monitorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        try {
            return ResponseEntity.ok(checkResultService.getResultsByMonitorIdAndTimeRange(monitorId, start, end));
        } catch (Exception e) {
            log.error("Erro ao buscar resultados por período para o monitor {}: {}", monitorId, e.getMessage(), e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
} 