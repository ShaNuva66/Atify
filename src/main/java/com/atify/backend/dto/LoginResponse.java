package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String message;
    private String token;
    private String role;
    private String refreshToken;
    private Long expiresInMs;

    public LoginResponse(String message, String token, String role) {
        this.message = message;
        this.token = token;
        this.role = role;
    }
}
