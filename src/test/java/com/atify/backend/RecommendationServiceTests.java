package com.atify.backend;

import com.atify.backend.dto.RecommendationResponse;
import com.atify.backend.entity.Album;
import com.atify.backend.entity.Artist;
import com.atify.backend.entity.Favorite;
import com.atify.backend.entity.ListeningHistory;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import com.atify.backend.entity.User;
import com.atify.backend.repository.FavoriteRepository;
import com.atify.backend.repository.ListeningHistoryRepository;
import com.atify.backend.repository.SongRepository;
import com.atify.backend.repository.UserRepository;
import com.atify.backend.service.RecommendationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTests {

    @Mock
    private SongRepository songRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private ListeningHistoryRepository listeningHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    @Test
    void recommendationRanksSameArtistAndPlaylistHigher() {
        Artist tarkan = Artist.builder().id(1L).name("Tarkan").build();
        Album popAlbum = Album.builder().id(10L).genre("Pop").artist(tarkan).name("Pop Album").releaseYear(2020).build();
        Playlist playlist = Playlist.builder().id(100L).name("Hits").build();

        Song target = Song.builder()
                .id(1L)
                .name("Song A")
                .duration(200)
                .artist(tarkan)
                .album(popAlbum)
                .playlists(List.of(playlist))
                .build();

        Song strongCandidate = Song.builder()
                .id(2L)
                .name("Song B")
                .duration(205)
                .artist(tarkan)
                .album(popAlbum)
                .playlists(List.of(playlist))
                .build();

        Song weakCandidate = Song.builder()
                .id(3L)
                .name("Song C")
                .duration(420)
                .artist(Artist.builder().id(2L).name("Another").build())
                .album(Album.builder().id(11L).genre("Rock").name("Rock Album").releaseYear(2020).build())
                .playlists(List.of())
                .build();

        when(songRepository.findById(1L)).thenReturn(Optional.of(target));
        when(songRepository.findAll()).thenReturn(List.of(target, strongCandidate, weakCandidate));

        List<RecommendationResponse> recommendations = recommendationService.getRecommendations(1L, 5);

        assertThat(recommendations).hasSize(1);
        assertThat(recommendations.get(0).getSongId()).isEqualTo(2L);
        assertThat(recommendations.get(0).getReasons()).isNotEmpty();
    }

    @Test
    void personalizedRecommendationsPreferFavoriteArtist() {
        User user = User.builder().id(99L).username("tester").build();
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("tester", "n/a"));

        Artist tarkan = Artist.builder().id(1L).name("Tarkan").build();
        Artist sezen = Artist.builder().id(2L).name("Sezen").build();
        Album popAlbum = Album.builder().id(10L).genre("Pop").artist(tarkan).name("Pop Album").releaseYear(2020).build();

        Song favoriteSong = Song.builder()
                .id(1L)
                .name("Favorite Song")
                .duration(200)
                .artist(tarkan)
                .album(popAlbum)
                .build();

        Song strongCandidate = Song.builder()
                .id(2L)
                .name("Strong Match")
                .duration(210)
                .artist(tarkan)
                .album(popAlbum)
                .build();

        Song weakCandidate = Song.builder()
                .id(3L)
                .name("Weak Match")
                .duration(420)
                .artist(sezen)
                .album(Album.builder().id(11L).genre("Rock").artist(sezen).name("Rock").releaseYear(2020).build())
                .build();

        when(userRepository.findByUsername("tester")).thenReturn(Optional.of(user));
        when(favoriteRepository.findAllByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of(Favorite.builder()
                        .id(1L)
                        .user(user)
                        .song(favoriteSong)
                        .createdAt(LocalDateTime.now())
                        .build()));
        when(listeningHistoryRepository.findAllByUserOrderByListenedAtDesc(user))
                .thenReturn(List.of(ListeningHistory.builder()
                        .id(1L)
                        .user(user)
                        .song(favoriteSong)
                        .listenedAt(LocalDateTime.now())
                        .build()));
        when(songRepository.findAll()).thenReturn(List.of(favoriteSong, strongCandidate, weakCandidate));

        List<RecommendationResponse> recommendations = recommendationService.getPersonalizedRecommendations(5);

        assertThat(recommendations).isNotEmpty();
        assertThat(recommendations.get(0).getSongId()).isEqualTo(2L);
        assertThat(recommendations.get(0).getReasons()).isNotEmpty();
        SecurityContextHolder.clearContext();
    }
}
