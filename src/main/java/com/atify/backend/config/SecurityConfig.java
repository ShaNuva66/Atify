package com.atify.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable() // form korumasını kapatıyoruz
                .authorizeHttpRequests()
                .anyRequest().permitAll(); // HER isteğe izin veriyoruz
        return http.build();
    }
}

// Burası bana ait değil  direk videodan çektim deneme için
