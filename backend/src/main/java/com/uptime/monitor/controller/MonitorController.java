package com.uptime.monitor.controller;

import com.uptime.monitor.model.Monitor;
import com.uptime.monitor.service.MonitorService;
import com.uptime.monitor.service.MonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monitors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MonitorController {
    
    private final MonitorService monitorService;
    private final MonitoringService monitoringService;
    
    @GetMapping
    public ResponseEntity<List<Monitor>> getAllMonitors() {
        return ResponseEntity.ok(monitorService.getAllMonitors());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Monitor> getMonitorById(@PathVariable Long id) {
        return monitorService.getMonitorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Monitor> createMonitor(@RequestBody Monitor monitor) {
        Monitor createdMonitor = monitorService.createMonitor(monitor);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMonitor);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Monitor> updateMonitor(@PathVariable Long id, @RequestBody Monitor monitor) {
        return monitorService.updateMonitor(id, monitor)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMonitor(@PathVariable Long id) {
        boolean deleted = monitorService.deleteMonitor(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/toggle")
    public ResponseEntity<Monitor> toggleMonitorStatus(@PathVariable Long id) {
        return monitorService.toggleMonitorStatus(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/{id}/check")
    public ResponseEntity<?> checkMonitorNow(@PathVariable Long id) {
        return monitorService.getMonitorById(id)
                .map(monitor -> ResponseEntity.ok(monitoringService.checkMonitor(monitor)))
                .orElse(ResponseEntity.notFound().build());
    }
} 