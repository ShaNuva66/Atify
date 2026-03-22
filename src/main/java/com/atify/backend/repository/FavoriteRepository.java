package com.atify.backend.repository;

import com.atify.backend.entity.Favorite;
import com.atify.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findAllByUserOrderByCreatedAtDesc(User user);

    Optional<Favorite> findByUserIdAndSongId(Long userId, Long songId);

    boolean existsByUserIdAndSongId(Long userId, Long songId);

    void deleteAllByUser(User user);
}
