package com.atify.backend.service;

import com.atify.backend.entity.RefreshToken;
import com.atify.backend.entity.User;
import com.atify.backend.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refreshExpirationMs:2592000000}")
    private long refreshExpirationMs;

    public RefreshToken createToken(User user) {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes))
                .user(user)
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken validateToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new RuntimeException("Refresh token is required.");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(rawToken)
                .orElseThrow(() -> new RuntimeException("Refresh token is invalid."));

        if (refreshToken.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked.");
        }

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new RuntimeException("Refresh token has expired.");
        }

        return refreshToken;
    }

    @Transactional
    public RefreshToken rotateToken(String rawToken) {
        RefreshToken current = validateToken(rawToken);
        current.setRevoked(true);
        refreshTokenRepository.save(current);
        return createToken(current.getUser());
    }

    @Transactional
    public void revokeToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        refreshTokenRepository.findByToken(rawToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }

    @Transactional
    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }
}
