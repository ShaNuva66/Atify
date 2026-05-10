package com.atify.backend.service;

import com.atify.backend.dto.AlbumRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Album;
import com.atify.backend.entity.Artist;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.SongRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlbumServiceTest {

    @Mock AlbumRepository albumRepo;
    @Mock SongRepository songRepo;
    @Mock ArtistRepository artistRepo;
    @Mock SongService songService;

    @InjectMocks AlbumService albumService;

    @Test
    void getSongsByAlbum_sarkilariOrtakSongMapperIleDoner() {
        Album album = Album.builder().id(3L).name("Album").build();
        Song jamendoSong = Song.builder().id(9L).name("Jamendo Album Track").externalSource("JAMENDO").build();
        SongResponse mapped = new SongResponse();
        mapped.setId(9L);
        mapped.setName("Jamendo Album Track");
        mapped.setSource("JAMENDO");
        mapped.setLicenseUrl("https://creativecommons.org/licenses/by/4.0/");
        mapped.setRightsVerified(true);

        when(albumRepo.findById(3L)).thenReturn(Optional.of(album));
        when(songRepo.findByAlbum(album)).thenReturn(List.of(jamendoSong));
        when(songService.toSongResponse(jamendoSong)).thenReturn(mapped);

        List<SongResponse> result = albumService.getSongsByAlbum(3L);

        assertThat(result).containsExactly(mapped);
        assertThat(result.get(0).getLicenseUrl()).isEqualTo("https://creativecommons.org/licenses/by/4.0/");
        verify(songService).toSongResponse(jamendoSong);
    }

    @Test
    void addAlbum_sanatciBilgisiyleDetayliResponseDoner() {
        Artist artist = Artist.builder().id(4L).name("Atify Artist").build();
        AlbumRequest request = new AlbumRequest();
        request.setName("Yeni Album");
        request.setGenre("Pop");
        request.setReleaseYear(2026);
        request.setArtistId(4L);

        when(artistRepo.findById(4L)).thenReturn(Optional.of(artist));
        when(albumRepo.save(any(Album.class))).thenAnswer(invocation -> {
            Album album = invocation.getArgument(0);
            album.setId(8L);
            return album;
        });

        var response = albumService.addAlbum(request);

        assertThat(response.getId()).isEqualTo(8L);
        assertThat(response.getName()).isEqualTo("Yeni Album");
        assertThat(response.getGenre()).isEqualTo("Pop");
        assertThat(response.getReleaseYear()).isEqualTo(2026);
        assertThat(response.getArtistId()).isEqualTo(4L);
        assertThat(response.getArtistName()).isEqualTo("Atify Artist");
    }

    @Test
    void updateAlbum_mevcutAlbumuGunceller() {
        Artist oldArtist = Artist.builder().id(1L).name("Eski").build();
        Artist newArtist = Artist.builder().id(2L).name("Yeni").build();
        Album album = Album.builder()
                .id(5L)
                .name("Eski Album")
                .genre("Rock")
                .releaseYear(2020)
                .artist(oldArtist)
                .build();
        AlbumRequest request = new AlbumRequest();
        request.setName("Guncel Album");
        request.setGenre("Jazz");
        request.setReleaseYear(2026);
        request.setArtistId(2L);
        request.setCoverUrl(" https://cdn.test/cover.jpg ");

        when(albumRepo.findById(5L)).thenReturn(Optional.of(album));
        when(artistRepo.findById(2L)).thenReturn(Optional.of(newArtist));
        when(albumRepo.save(album)).thenReturn(album);

        var response = albumService.updateAlbum(5L, request);

        assertThat(response.getName()).isEqualTo("Guncel Album");
        assertThat(response.getGenre()).isEqualTo("Jazz");
        assertThat(response.getReleaseYear()).isEqualTo(2026);
        assertThat(response.getCoverUrl()).isEqualTo("https://cdn.test/cover.jpg");
        assertThat(response.getArtistId()).isEqualTo(2L);
    }

    @Test
    void deleteAlbum_sarkilariSilmedenAlbumBaginiKoparir() {
        Album album = Album.builder().id(7L).name("Silinecek").build();
        Song song = Song.builder().id(11L).name("Parca").album(album).build();

        when(albumRepo.findById(7L)).thenReturn(Optional.of(album));
        when(songRepo.findByAlbum(album)).thenReturn(List.of(song));

        albumService.deleteAlbum(7L);

        assertThat(song.getAlbum()).isNull();
        verify(songRepo).saveAll(List.of(song));
        verify(albumRepo).delete(album);
    }
}
