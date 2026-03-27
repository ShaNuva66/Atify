package com.atify.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppSetting {

    @Id
    @Column(name = "setting_key", nullable = false, length = 120)
    private String settingKey;

    @Lob
    @Column(name = "setting_value", columnDefinition = "LONGTEXT")
    private String settingValue;

    private LocalDateTime updatedAt;
}
