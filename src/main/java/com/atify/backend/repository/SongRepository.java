package com.atify.backend.repository;

import com.atify.backend.entity.Album;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SongRepository extends JpaRepository<Song, Long> {

    List<Song> findByAlbum(Album album);

    List<Song> findByPlaylists(Playlist playlist);

    Optional<Song> findByFingerprintCode(String fingerprintCode);

    List<Song> findByFingerprintDataIsNotNull();

    Optional<Song> findByExternalSourceAndExternalRef(String externalSource, String externalRef);
}
