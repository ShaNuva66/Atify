package com.atify.backend.repository;

import com.atify.backend.entity.Album;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SongRepository extends JpaRepository<Song, Long> {

    List<Song> findByAlbum(Album album);

    List<Song> findByPlaylists(Playlist playlist);

    Optional<Song> findByFingerprintCode(String fingerprintCode);

    List<Song> findByFingerprintDataIsNotNull();

    Optional<Song> findByExternalSourceAndExternalRef(String externalSource, String externalRef);

    // Pagination
    Page<Song> findAll(Pageable pageable);

    // Arama: şarkı adı veya sanatçı adı içeren
    @Query("SELECT s FROM Song s WHERE " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(s.artist.name) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Song> searchByNameOrArtist(@Param("q") String q, Pageable pageable);

    // Fingerprint eksik olan ama ses kaynağı olan şarkılar
    @Query("SELECT s FROM Song s WHERE " +
           "(s.fileName IS NOT NULL AND s.fileName <> '') OR " +
           "(s.audioUrl IS NOT NULL AND s.audioUrl <> '')")
    List<Song> findAllWithAudioSource();
}
