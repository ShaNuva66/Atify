package com.atify.backend.repository;

import com.atify.backend.entity.User;
import com.atify.backend.entity.Playlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {

    // 🔹 Get all playlists for a specific user
    List<Playlist> findByUser(User user);
}
