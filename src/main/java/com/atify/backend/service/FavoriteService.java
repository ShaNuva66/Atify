package com.atify.backend.service;

import com.atify.backend.dto.FavoriteResponse;
import com.atify.backend.dto.JamendoImportRequest;
import com.atify.backend.entity.Favorite;
import com.atify.backend.entity.Song;
import com.atify.backend.entity.User;
import com.atify.backend.repository.FavoriteRepository;
import com.atify.backend.repository.SongRepository;
import com.atify.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final SongRepository songRepository;
    private final UserRepository userRepository;
    private final SongService songService;

    public List<FavoriteResponse> getFavorites() {
        User user = getActiveUser();
        return favoriteRepository.findAllByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public FavoriteResponse addFavorite(Long songId) {
        User user = getActiveUser();
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        Favorite favorite = favoriteRepository.findByUserIdAndSongId(user.getId(), songId)
                .orElseGet(() -> favoriteRepository.save(Favorite.builder()
                        .user(user)
                        .song(song)
                        .createdAt(LocalDateTime.now())
                        .build()));

        return toResponse(favorite);
    }

    public FavoriteResponse addJamendoFavorite(JamendoImportRequest request) {
        Song song = songService.importJamendoTrack(request);
        return addFavorite(song.getId());
    }

    public void removeFavorite(Long songId) {
        User user = getActiveUser();
        Favorite favorite = favoriteRepository.findByUserIdAndSongId(user.getId(), songId)
                .orElseThrow(() -> new RuntimeException("Favorite not found"));
        favoriteRepository.delete(favorite);
    }

    public boolean isFavorite(Long songId) {
        User user = getActiveUser();
        return favoriteRepository.existsByUserIdAndSongId(user.getId(), songId);
    }

    private FavoriteResponse toResponse(Favorite favorite) {
        Song song = favorite.getSong();
        return new FavoriteResponse(
                song.getId(),
                song.getName(),
                song.getArtist() != null ? song.getArtist().getName() : null,
                song.getDuration(),
                song.getCoverUrl(),
                song.getAudioUrl(),
                song.getExternalSource() == null ? "LOCAL" : song.getExternalSource(),
                song.getExternalRef(),
                favorite.getCreatedAt()
        );
    }

    private User getActiveUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
