package com.atify.backend.repository;

import com.atify.backend.entity.RefreshToken;
import com.atify.backend.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    @EntityGraph(attributePaths = "user")
    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);

    void deleteByExpiresAtBefore(Instant cutoff);
}
