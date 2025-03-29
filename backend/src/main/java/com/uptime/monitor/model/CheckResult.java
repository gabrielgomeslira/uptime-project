package com.uptime.monitor.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "check_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monitor_id")
    private Monitor monitor;
    
    private Boolean success;
    private Integer responseTime;
    private String errorMessage;
    private LocalDateTime checkedAt;
    
    @PrePersist
    protected void onCreate() {
        checkedAt = LocalDateTime.now();
    }
} 