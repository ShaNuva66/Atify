package com.atify.backend.service;

import com.atify.backend.dto.ArtistRequest;
import com.atify.backend.dto.ArtistResponse;
import com.atify.backend.entity.Artist;
import com.atify.backend.repository.ArtistRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ArtistService {

    private final ArtistRepository artistRepo;

    public ArtistService(ArtistRepository artistRepo) {
        this.artistRepo = artistRepo;
    }

    // ✅ Add new artist
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

        return new ArtistResponse(
                savedArtist.getId(),
                savedArtist.getName(),
                savedArtist.getCountry(),
                savedArtist.getBirthDate(),
                savedArtist.getBiography(),
                savedArtist.getProfileImageUrl()
        );
    }

    // ✅ Get all artists
    public List<ArtistResponse> getAllArtists() {
        return artistRepo.findAll().stream()
                .map(artist -> new ArtistResponse(
                        artist.getId(),
                        artist.getName(),
                        artist.getCountry(),
                        artist.getBirthDate(),
                        artist.getBiography(),
                        artist.getProfileImageUrl()
                ))
                .collect(Collectors.toList());
    }

    // ✅ Delete artist
    public void deleteArtist(Long id) {
        boolean exists = artistRepo.existsById(id);
        if (!exists) {
            throw new RuntimeException("Artist not found.");
        }
        artistRepo.deleteById(id);
    }

    // ✅ Update artist
    public ArtistResponse updateArtist(Long id, ArtistRequest request) {
        Artist artist = artistRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist to update not found."));

        artist.setName(request.getName());
        artist.setCountry(request.getCountry());
        artist.setBirthDate(request.getBirthDate());
        artist.setBiography(request.getBiography());
        artist.setProfileImageUrl(request.getProfileImageUrl());

        Artist updatedArtist = artistRepo.save(artist);

        return new ArtistResponse(
                updatedArtist.getId(),
                updatedArtist.getName(),
                updatedArtist.getCountry(),
                updatedArtist.getBirthDate(),
                updatedArtist.getBiography(),
                updatedArtist.getProfileImageUrl()
        );
    }
}
