package com.atify.backend.repository;

import com.atify.backend.entity.Album;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SongRepository extends JpaRepository<Song, Long> {

    // 🔹 Get songs by album
    List<Song> findByAlbum(Album album);

    // 🔹 Get songs by playlist (must match the field name in Song entity)
    List<Song> findByPlaylists(Playlist playlist);

    // 🔹 Dejavu'dan gelen fingerprintCode (song_code) ile şarkıyı bul
    Optional<Song> findByFingerprintCode(String fingerprintCode);

}
