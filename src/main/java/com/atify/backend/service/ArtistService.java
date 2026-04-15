package com.atify.backend.service;

import com.atify.backend.dto.ArtistRequest;
import com.atify.backend.dto.ArtistResponse;
import com.atify.backend.entity.Artist;
import com.atify.backend.repository.ArtistRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ArtistService {

    private final ArtistRepository artistRepo;
    private final AuditLogService auditLogService;

    public ArtistService(ArtistRepository artistRepo, AuditLogService auditLogService) {
        this.artistRepo = artistRepo;
        this.auditLogService = auditLogService;
    }

    @CacheEvict(value = {"artists", "search"}, allEntries = true)
    public ArtistResponse addArtist(ArtistRequest request) {
        boolean exists = artistRepo.existsByName(request.getName());
        if (exists) {
            throw new RuntimeException("This artist already exists.");
        }

        Artist newArtist = new Artist();
        newArtist.setName(request.getName());
        newArtist.setCountry(request.getCountry());
        newArtist.setBirthDate(request.getBirthDate());
        newArtist.setBiography(request.getBiography());
        newArtist.setProfileImageUrl(request.getProfileImageUrl());

        Artist savedArtist = artistRepo.save(newArtist);
        auditLogService.record(
                "ARTIST_CREATED",
                "ARTIST",
                savedArtist.getId(),
                savedArtist.getName() + " sanatçısı eklendi."
        );

        return toResponse(savedArtist);
    }

    @Cacheable("artists")
    public List<ArtistResponse> getAllArtists() {
        return artistRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = {"artists", "search"}, allEntries = true)
    public void deleteArtist(Long id) {
        Artist artist = artistRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found."));
        artistRepo.delete(artist);
        auditLogService.record(
                "ARTIST_DELETED",
                "ARTIST",
                id,
                artist.getName() + " sanatçısı silindi."
        );
    }

    @CacheEvict(value = {"artists", "search"}, allEntries = true)
    public ArtistResponse updateArtist(Long id, ArtistRequest request) {
        Artist artist = artistRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist to update not found."));

        artist.setName(request.getName());
        artist.setCountry(request.getCountry());
        artist.setBirthDate(request.getBirthDate());
        artist.setBiography(request.getBiography());
        artist.setProfileImageUrl(request.getProfileImageUrl());

        Artist updatedArtist = artistRepo.save(artist);
        auditLogService.record(
                "ARTIST_UPDATED",
                "ARTIST",
                updatedArtist.getId(),
                updatedArtist.getName() + " sanatçısı güncellendi."
        );

        return toResponse(updatedArtist);
    }

    private ArtistResponse toResponse(Artist artist) {
        return new ArtistResponse(
                artist.getId(),
                artist.getName(),
                artist.getCountry(),
                artist.getBirthDate(),
                artist.getBiography(),
                artist.getProfileImageUrl()
        );
    }
}
