package com.uptime.monitor.service;

import com.uptime.monitor.model.CheckResult;
import com.uptime.monitor.model.Monitor;
import com.uptime.monitor.repository.CheckResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckResultService {
    
    private final CheckResultRepository checkResultRepository;
    
    public List<CheckResult> getResultsByMonitorId(Long monitorId) {
        try {
            if (monitorId == null) {
                log.warn("Tentativa de buscar resultados com ID de monitor nulo");
                return Collections.emptyList();
            }
            
            List<CheckResult> results = checkResultRepository.findByMonitorIdOrderByCheckedAtDesc(monitorId);
            log.debug("Encontrados {} resultados para o monitor {}", results.size(), monitorId);
            return results;
        } catch (Exception e) {
            log.error("Erro ao buscar resultados para o monitor {}: {}", monitorId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }
    
    public List<CheckResult> getResultsByMonitorIdAndTimeRange(Long monitorId, LocalDateTime start, LocalDateTime end) {
        try {
            if (monitorId == null) {
                log.warn("Tentativa de buscar resultados com ID de monitor nulo");
                return Collections.emptyList();
            }
            
            if (start == null || end == null) {
                log.warn("Período de datas inválido para busca de resultados do monitor {}", monitorId);
                return Collections.emptyList();
            }
            
            List<CheckResult> results = checkResultRepository.findByMonitorIdAndCheckedAtBetweenOrderByCheckedAtDesc(monitorId, start, end);
            log.debug("Encontrados {} resultados para o monitor {} no período especificado", results.size(), monitorId);
            return results;
        } catch (Exception e) {
            log.error("Erro ao buscar resultados para o monitor {} no período: {}", monitorId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }
    
    @Transactional
    public CheckResult saveResult(CheckResult result) {
        try {
            if (result == null) {
                log.warn("Tentativa de salvar resultado nulo");
                throw new IllegalArgumentException("O resultado de verificação não pode ser nulo");
            }
            
            if (result.getMonitor() == null) {
                log.warn("Tentativa de salvar resultado sem referência ao monitor");
                throw new IllegalArgumentException("O resultado de verificação deve ter referência a um monitor");
            }
            
            CheckResult saved = checkResultRepository.save(result);
            log.debug("Resultado salvo com sucesso para o monitor: {}", result.getMonitor().getId());
            return saved;
        } catch (Exception e) {
            log.error("Erro ao salvar resultado: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    public CheckResult getLatestResultForMonitor(Monitor monitor) {
        try {
            if (monitor == null) {
                log.warn("Tentativa de buscar último resultado para monitor nulo");
                return null;
            }
            
            CheckResult result = checkResultRepository.findLatestByMonitor(monitor);
            if (result == null) {
                log.debug("Nenhum resultado encontrado para o monitor: {}", monitor.getId());
            }
            return result;
        } catch (Exception e) {
            log.error("Erro ao buscar último resultado para o monitor {}: {}", 
                    monitor != null ? monitor.getId() : "nulo", e.getMessage(), e);
            return null;
        }
    }
} 