package com.atify.backend.service;

import com.atify.backend.dto.SearchResponse;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.SongRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock SongRepository songRepository;
    @Mock ArtistRepository artistRepository;
    @Mock AlbumRepository albumRepository;
    @Mock SongService songService;

    @InjectMocks SearchService searchService;

    @Test
    void search_sarkilariOrtakSongMapperIleDoner() {
        Song jamendoSong = Song.builder().id(7L).name("Jamendo Track").externalSource("JAMENDO").build();
        SongResponse mapped = new SongResponse();
        mapped.setId(7L);
        mapped.setName("Jamendo Track");
        mapped.setSource("JAMENDO");
        mapped.setLicenseUrl("https://creativecommons.org/licenses/by/4.0/");
        mapped.setRightsVerified(true);

        when(songRepository.searchByNameOrArtist(eq("jam"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(jamendoSong), PageRequest.of(0, 10), 1));
        when(songService.toSongResponse(jamendoSong)).thenReturn(mapped);
        when(artistRepository.findByNameContainingIgnoreCase("jam")).thenReturn(List.of());
        when(albumRepository.findByNameContainingIgnoreCase("jam")).thenReturn(List.of());

        SearchResponse result = searchService.search("jam", 0, 10);

        assertThat(result.getSongs().getContent()).containsExactly(mapped);
        assertThat(result.getSongs().getContent().get(0).getLicenseUrl())
                .isEqualTo("https://creativecommons.org/licenses/by/4.0/");
        verify(songService).toSongResponse(jamendoSong);
    }
}
