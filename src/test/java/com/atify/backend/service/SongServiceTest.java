package com.atify.backend.service;

import com.atify.backend.dto.SongRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Album;
import com.atify.backend.entity.Artist;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.PlaylistRepository;
import com.atify.backend.repository.SongRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SongServiceTest {

    @Mock SongRepository songRepo;
    @Mock AlbumRepository albumRepo;
    @Mock ArtistRepository artistRepo;
    @Mock PlaylistRepository playlistRepo;
    @Mock AuditLogService auditLogService;
    @Mock FingerprintService fingerprintService;
    @Mock JamendoService jamendoService;

    @InjectMocks SongService songService;

    // ---- getAllSongs (list) ----

    @Test
    void getAllSongs_bosDatabasede_bosListeDoner() {
        when(songRepo.findAll(any(Sort.class))).thenReturn(List.of());

        List<SongResponse> result = songService.getAllSongs();

        assertThat(result).isEmpty();
    }

    @Test
    void getAllSongs_veriVarsa_dogruMapler() {
        Artist artist = Artist.builder().id(1L).name("Sanatçı").build();
        Song song = Song.builder().id(1L).name("Test Şarkı").duration(180).artist(artist).build();
        when(songRepo.findAll(any(Sort.class))).thenReturn(List.of(song));

        List<SongResponse> result = songService.getAllSongs();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Şarkı");
        assertThat(result.get(0).getArtistName()).isEqualTo("Sanatçı");
        assertThat(result.get(0).getSource()).isEqualTo("LOCAL");
    }

    @Test
    void toSongResponse_jamendoParcadaLisansBilgisiniKorur() {
        Artist artist = Artist.builder().id(1L).name("Jamendo Artist").build();
        Album album = Album.builder().id(9L).name("Jamendo Album").build();
        Song song = Song.builder()
                .id(77L)
                .name("Jamendo Track")
                .duration(210)
                .artist(artist)
                .album(album)
                .coverUrl("https://img.example/cover.jpg")
                .audioUrl("https://audio.example/track.mp3")
                .externalSource("JAMENDO")
                .externalRef("jam-77")
                .externalUrl("https://jamendo.example/track")
                .licenseUrl("https://creativecommons.org/licenses/by/4.0/")
                .rightsVerified(true)
                .rightsOwner("Jamendo Artist")
                .rightsNotes("Creative Commons")
                .build();

        SongResponse result = songService.toSongResponse(song);

        assertThat(result.getSource()).isEqualTo("JAMENDO");
        assertThat(result.getExternalUrl()).isEqualTo("https://jamendo.example/track");
        assertThat(result.getLicenseUrl()).isEqualTo("https://creativecommons.org/licenses/by/4.0/");
        assertThat(result.isRightsVerified()).isTrue();
        assertThat(result.getRightsOwner()).isEqualTo("Jamendo Artist");
        assertThat(result.getRightsNotes()).isEqualTo("Creative Commons");
        assertThat(result.getCopyrightNotice()).contains("Jamendo");
        assertThat(result.getAlbumId()).isEqualTo(9L);
        assertThat(result.getAlbumName()).isEqualTo("Jamendo Album");
    }

    // ---- getAllSongs (paginated) ----

    @Test
    void getAllSongs_sayfali_dogruPageResponseDoner() {
        Artist artist = Artist.builder().id(1L).name("Sanatçı").build();
        Song song = Song.builder().id(1L).name("Şarkı").duration(200).artist(artist).build();
        PageImpl<Song> page = new PageImpl<>(List.of(song), PageRequest.of(0, 10), 1);
        when(songRepo.findAll(any(PageRequest.class))).thenReturn(page);

        var result = songService.getAllSongs(0, 10);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getPage()).isEqualTo(0);
    }

    // ---- addSong ----

    @Test
    void addSong_sanatciYoksa_exception() {
        SongRequest request = new SongRequest();
        request.setName("Yeni Şarkı");
        request.setArtistId(99L);

        when(artistRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> songService.addSong(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Sanatçı bulunamadı");
    }

    @Test
    void addSong_gecerliRequest_sarki_kaydedilir() {
        Artist artist = Artist.builder().id(1L).name("Sanatçı").build();
        SongRequest request = new SongRequest();
        request.setName("Yeni Şarkı");
        request.setDuration(180);
        request.setArtistId(1L);
        request.setRightsVerified(true);
        request.setRightsOwner("Test hak sahibi");
        request.setRightsNotes("Test izin notu");

        when(artistRepo.findById(1L)).thenReturn(Optional.of(artist));
        Song saved = Song.builder().id(10L).name("Yeni Şarkı").duration(180).artist(artist).build();
        saved.setRightsVerified(true);
        saved.setRightsOwner("Test hak sahibi");
        saved.setRightsNotes("Test izin notu");
        when(songRepo.save(any(Song.class))).thenReturn(saved);

        SongResponse result = songService.addSong(request);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("Yeni Şarkı");
        assertThat(result.isRightsVerified()).isTrue();
        verify(auditLogService).record(eq("SONG_CREATED"), eq("SONG"), eq(10L), any());
    }

    @Test
    void addSong_hakDogrulamasiYoksa_exception() {
        Artist artist = Artist.builder().id(1L).name("SanatÃ§Ä±").build();
        SongRequest request = new SongRequest();
        request.setName("Yeni ÅarkÄ±");
        request.setDuration(180);
        request.setArtistId(1L);

        when(artistRepo.findById(1L)).thenReturn(Optional.of(artist));

        assertThatThrownBy(() -> songService.addSong(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("hakki dogrulamasi zorunlu");
    }

    // ---- updateSong ----

    @Test
    void updateSong_sarkiYoksa_exception() {
        when(songRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> songService.updateSong(999L, new SongRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Şarkı bulunamadı");
    }

    @Test
    void updateSong_gecerli_guncellenir() {
        Artist artist = Artist.builder().id(1L).name("Sanatçı").build();
        Song existing = Song.builder().id(5L).name("Eski İsim").duration(100).artist(artist).build();
        when(songRepo.findById(5L)).thenReturn(Optional.of(existing));

        SongRequest request = new SongRequest();
        request.setName("Yeni İsim");
        request.setDuration(200);

        Song updated = Song.builder().id(5L).name("Yeni İsim").duration(200).artist(artist).build();
        when(songRepo.save(any())).thenReturn(updated);

        SongResponse result = songService.updateSong(5L, request);

        assertThat(result.getName()).isEqualTo("Yeni İsim");
        verify(auditLogService).record(eq("SONG_UPDATED"), eq("SONG"), eq(5L), any());
    }

    @Test
    void updateSong_clearAlbumTrue_albumBaginiKaldirir() {
        Artist artist = Artist.builder().id(1L).name("Sanatçı").build();
        Album album = Album.builder().id(3L).name("Album").build();
        Song existing = Song.builder().id(5L).name("Parça").duration(100).artist(artist).album(album).build();
        when(songRepo.findById(5L)).thenReturn(Optional.of(existing));
        when(songRepo.save(existing)).thenReturn(existing);

        SongRequest request = new SongRequest();
        request.setName("Parça");
        request.setDuration(100);
        request.setClearAlbum(true);

        SongResponse result = songService.updateSong(5L, request);

        assertThat(existing.getAlbum()).isNull();
        assertThat(result.getAlbumId()).isNull();
        assertThat(result.getAlbumName()).isNull();
    }

    // ---- deleteSong ----

    @Test
    void deleteSong_sarkiYoksa_exception() {
        when(songRepo.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> songService.deleteSong(404L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Şarkı bulunamadı");
    }

    @Test
    void deleteSong_gecerli_silinir() {
        Song song = Song.builder().id(1L).name("Silinecek").playlists(List.of()).build();
        when(songRepo.findById(1L)).thenReturn(Optional.of(song));

        songService.deleteSong(1L);

        verify(fingerprintService).unregisterFingerprint(song);
        verify(songRepo).delete(song);
        verify(auditLogService).record(eq("SONG_DELETED"), eq("SONG"), eq(1L), any());
    }
}
