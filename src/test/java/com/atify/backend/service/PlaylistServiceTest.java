package com.atify.backend.service;

import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import com.atify.backend.entity.User;
import com.atify.backend.repository.PlaylistRepository;
import com.atify.backend.repository.SongRepository;
import com.atify.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlaylistServiceTest {

    @Mock SongRepository songRepo;
    @Mock PlaylistRepository playlistRepo;
    @Mock UserRepository userRepo;
    @Mock SongService songService;

    @InjectMocks PlaylistService playlistService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getSongsByPlaylist_sarkiMapperIleLisansBilgisiniKorur() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("u", null, List.of())
        );
        User owner = User.builder().id(1L).username("u").email("u@test.com").password("p").build();
        Song jamendoSong = Song.builder()
                .id(77L)
                .name("Jamendo Track")
                .externalSource("JAMENDO")
                .licenseUrl("https://creativecommons.org/licenses/by/4.0/")
                .build();
        Playlist playlist = Playlist.builder()
                .id(5L)
                .name("Set")
                .user(owner)
                .songs(List.of(jamendoSong))
                .build();
        SongResponse mapped = new SongResponse(
                77L,
                "Jamendo Track",
                0,
                null,
                null,
                "https://audio.example/track.mp3",
                "JAMENDO",
                "https://jamendo.example/track",
                "https://creativecommons.org/licenses/by/4.0/",
                true,
                "Jamendo Artist",
                "Creative Commons",
                "Jamendo lisans bilgisi"
        );

        when(playlistRepo.findById(5L)).thenReturn(Optional.of(playlist));
        when(songService.toSongResponse(jamendoSong)).thenReturn(mapped);

        List<SongResponse> result = playlistService.getSongsByPlaylist(5L);

        assertThat(result).containsExactly(mapped);
        assertThat(result.get(0).getLicenseUrl()).isEqualTo("https://creativecommons.org/licenses/by/4.0/");
        assertThat(result.get(0).isRightsVerified()).isTrue();
        verify(songService).toSongResponse(jamendoSong);
    }
}
