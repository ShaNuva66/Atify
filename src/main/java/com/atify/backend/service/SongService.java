package com.atify.backend.service;

import com.atify.backend.dto.SongRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Album;
import com.atify.backend.entity.Artist;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.PlaylistRepository;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SongService {

    private final SongRepository songRepo;
    private final AlbumRepository albumRepo;
    private final ArtistRepository artistRepo;
    private final PlaylistRepository playlistRepo;

    // 🔹 SONG EKLEME
    public SongResponse addSong(SongRequest request) {

        // Artist yine zorunlu
        Artist artist = artistRepo.findById(request.getArtistId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Artist not found: " + request.getArtistId()));

        // Albüm artık zorunlu değil
        Album album = null;
        if (request.getAlbumId() != null) {
            album = albumRepo.findById(request.getAlbumId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Album not found: " + request.getAlbumId()));
        }

        // Playlist yine opsiyonel
        List<Playlist> playlists = new ArrayList<>();
        if (request.getPlaylistIdList() != null && !request.getPlaylistIdList().isEmpty()) {
            playlists = playlistRepo.findAllById(request.getPlaylistIdList());
        }

        Song song = Song.builder()
                .name(request.getName())
                .duration(request.getDuration())
                .artist(artist)
                .album(album)        // artık null olabilir
                .playlists(playlists)
                .build();

        Song saved = songRepo.save(song);
        return new SongResponse(saved.getId(), saved.getName(), saved.getDuration());
    }

    // 🔹 SONG GÜNCELLEME (ADMIN edit için)
    public SongResponse updateSong(Long id, SongRequest request) {

        // Önce mevcut şarkıyı bul
        Song song = songRepo.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Song not found: " + id));

        // İsim
        if (request.getName() != null && !request.getName().isBlank()) {
            song.setName(request.getName());
        }

        // Süre (0 gelse bile güncelliyoruz; istersen buraya özel mantık koyabilirsin)
        song.setDuration(request.getDuration());

        // Artist güncelle
        if (request.getArtistId() != null) {
            Artist artist = artistRepo.findById(request.getArtistId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Artist not found: " + request.getArtistId()));
            song.setArtist(artist);
        }

        // Albüm güncelle (null geçilirse albümü silebiliriz)
        if (request.getAlbumId() != null) {
            Album album = albumRepo.findById(request.getAlbumId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Album not found: " + request.getAlbumId()));
            song.setAlbum(album);
        }

        // Playlist listesi güncelle (null gelirse hiç dokunma, boş liste gelirse temizle)
        if (request.getPlaylistIdList() != null) {
            List<Playlist> playlists;
            if (request.getPlaylistIdList().isEmpty()) {
                playlists = new ArrayList<>();
            } else {
                playlists = playlistRepo.findAllById(request.getPlaylistIdList());
            }
            song.setPlaylists(playlists);
        }

        Song updated = songRepo.save(song);
        return new SongResponse(updated.getId(), updated.getName(), updated.getDuration());
    }

    // 🔹 TÜM ŞARKILAR
    public List<SongResponse> getAllSongs() {
        return songRepo.findAll()
                .stream()
                .map(s -> new SongResponse(s.getId(), s.getName(), s.getDuration()))
                .toList();
    }
}
