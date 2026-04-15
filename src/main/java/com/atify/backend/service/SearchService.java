package com.atify.backend.service;

import com.atify.backend.dto.AlbumResponse;
import com.atify.backend.dto.ArtistResponse;
import com.atify.backend.dto.PageResponse;
import com.atify.backend.dto.SearchResponse;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final SongRepository songRepository;
    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;

    @Cacheable(value = "search", key = "#query + '-' + #page + '-' + #size")
    public SearchResponse search(String query, int page, int size) {
        if (query == null || query.isBlank()) {
            return new SearchResponse(query, PageResponse.of(
                    songRepository.findAll(PageRequest.of(page, size, Sort.by("name")))
                            .map(this::toSongResponse)
            ), List.of(), List.of());
        }

        String q = query.trim();

        PageResponse<SongResponse> songs = PageResponse.of(
                songRepository.searchByNameOrArtist(q, PageRequest.of(page, size, Sort.by("name")))
                        .map(this::toSongResponse)
        );

        List<ArtistResponse> artists = artistRepository.findByNameContainingIgnoreCase(q)
                .stream()
                .map(a -> new ArtistResponse(a.getId(), a.getName(), a.getCountry(),
                        a.getBirthDate(), a.getBiography(), a.getProfileImageUrl()))
                .toList();

        List<AlbumResponse> albums = albumRepository.findByNameContainingIgnoreCase(q)
                .stream()
                .map(al -> new AlbumResponse(al.getId(), al.getName(), al.getCoverUrl()))
                .toList();

        return new SearchResponse(q, songs, artists, albums);
    }

    private SongResponse toSongResponse(com.atify.backend.entity.Song song) {
        return new SongResponse(
                song.getId(),
                song.getName(),
                song.getDuration(),
                song.getArtist() != null ? song.getArtist().getName() : null,
                song.getCoverUrl(),
                song.getAudioUrl(),
                song.getExternalSource() == null ? "LOCAL" : song.getExternalSource()
        );
    }
}
