package com.uptime.monitor.service;

import com.uptime.monitor.model.Monitor;
import com.uptime.monitor.repository.MonitorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MonitorService {
    
    private final MonitorRepository monitorRepository;
    
    public List<Monitor> getAllMonitors() {
        return monitorRepository.findAll();
    }
    
    public List<Monitor> getActiveMonitors() {
        return monitorRepository.findByActive(true);
    }
    
    public Optional<Monitor> getMonitorById(Long id) {
        return monitorRepository.findById(id);
    }
    
    @Transactional
    public Monitor createMonitor(Monitor monitor) {
        return monitorRepository.save(monitor);
    }
    
    @Transactional
    public Optional<Monitor> updateMonitor(Long id, Monitor updatedMonitor) {
        return monitorRepository.findById(id)
                .map(monitor -> {
                    monitor.setName(updatedMonitor.getName());
                    monitor.setUrl(updatedMonitor.getUrl());
                    monitor.setType(updatedMonitor.getType());
                    monitor.setPort(updatedMonitor.getPort());
                    monitor.setCheckInterval(updatedMonitor.getCheckInterval());
                    monitor.setActive(updatedMonitor.getActive());
                    return monitorRepository.save(monitor);
                });
    }
    
    @Transactional
    public boolean deleteMonitor(Long id) {
        return monitorRepository.findById(id)
                .map(monitor -> {
                    monitorRepository.delete(monitor);
                    return true;
                })
                .orElse(false);
    }
    
    @Transactional
    public Optional<Monitor> toggleMonitorStatus(Long id) {
        return monitorRepository.findById(id)
                .map(monitor -> {
                    monitor.setActive(!monitor.getActive());
                    return monitorRepository.save(monitor);
                });
    }
} 