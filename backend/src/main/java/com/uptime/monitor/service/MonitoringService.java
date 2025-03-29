package com.uptime.monitor.service;

import com.uptime.monitor.model.CheckResult;
import com.uptime.monitor.model.Monitor;
import com.uptime.monitor.model.MonitorType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.Socket;
import java.net.URL;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringService {
    
    private final MonitorService monitorService;
    private final CheckResultService checkResultService;
    
    @Scheduled(fixedRate = 60000)
    public void checkAllMonitors() {
        List<Monitor> activeMonitors = monitorService.getActiveMonitors();
        for (Monitor monitor : activeMonitors) {
            checkMonitor(monitor);
        }
    }
    
    public CheckResult checkMonitor(Monitor monitor) {
        CheckResult result = new CheckResult();
        result.setMonitor(monitor);
        
        long startTime = System.currentTimeMillis();
        try {
            boolean isSuccess = false;
            
            switch (monitor.getType()) {
                case HTTP:
                case HTTPS:
                    isSuccess = checkHttp(monitor.getUrl());
                    break;
                case PING:
                    isSuccess = checkPing(monitor.getUrl());
                    break;
                case DNS:
                    isSuccess = checkDns(monitor.getUrl());
                    break;
                case PORT:
                    isSuccess = checkPort(monitor.getUrl(), monitor.getPort());
                    break;
            }
            
            result.setSuccess(isSuccess);
            if (!isSuccess) {
                result.setErrorMessage("Falha ao verificar: " + monitor.getUrl());
            }
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            log.error("Erro ao verificar monitor {}: {}", monitor.getName(), e.getMessage());
        } finally {
            long endTime = System.currentTimeMillis();
            result.setResponseTime((int) (endTime - startTime));
        }
        
        return checkResultService.saveResult(result);
    }
    
    private boolean checkHttp(String url) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);
        
        int responseCode = connection.getResponseCode();
        return responseCode >= 200 && responseCode < 400;
    }
    
    private boolean checkPing(String host) throws IOException {
        return InetAddress.getByName(host).isReachable(5000);
    }
    
    private boolean checkDns(String domain) {
        try {
            InetAddress[] addresses = InetAddress.getAllByName(domain);
            return addresses != null && addresses.length > 0;
        } catch (Exception e) {
            log.error("Erro ao verificar DNS {}: {}", domain, e.getMessage());
            return false;
        }
    }
    
    private boolean checkPort(String host, int port) {
        try (Socket socket = new Socket(host, port)) {
            return true;
        } catch (Exception e) {
            log.error("Erro ao verificar porta {}:{}: {}", host, port, e.getMessage());
            return false;
        }
    }
} 