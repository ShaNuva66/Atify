package com.atify.backend.service;

import com.atify.backend.dto.RecommendationResponse;
import com.atify.backend.entity.Favorite;
import com.atify.backend.entity.ListeningHistory;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import com.atify.backend.entity.User;
import com.atify.backend.repository.FavoriteRepository;
import com.atify.backend.repository.ListeningHistoryRepository;
import com.atify.backend.repository.SongRepository;
import com.atify.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final SongRepository songRepository;
    private final FavoriteRepository favoriteRepository;
    private final ListeningHistoryRepository listeningHistoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<RecommendationResponse> getRecommendations(Long songId, int limit) {
        Song target = songRepository.findById(songId)
                .orElseThrow(() -> new IllegalArgumentException("?ark? bulunamad?: " + songId));

        Set<Long> targetPlaylistIds = playlistIds(target);
        String targetArtist = target.getArtist() != null ? normalize(target.getArtist().getName()) : "";
        String targetGenre = target.getAlbum() != null ? normalize(target.getAlbum().getGenre()) : "";

        return songRepository.findAll().stream()
                .filter(candidate -> !candidate.getId().equals(songId))
                .map(candidate -> scoreCandidate(target, candidate, targetPlaylistIds, targetArtist, targetGenre))
                .filter(item -> item.score() > 0)
                .sorted(Comparator
                        .comparingDouble(ScoredRecommendation::score).reversed()
                        .thenComparing(item -> safeName(item.response().getSongName()), String.CASE_INSENSITIVE_ORDER))
                .limit(Math.max(1, limit))
                .map(ScoredRecommendation::response)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<RecommendationResponse> getPersonalizedRecommendations(int limit) {
        User user = getActiveUser();
        int safeLimit = Math.max(1, limit);

        List<Favorite> favorites = favoriteRepository.findAllByUserOrderByCreatedAtDesc(user);
        List<ListeningHistory> history = listeningHistoryRepository.findAllByUserOrderByListenedAtDesc(user);

        RecommendationProfile profile = buildProfile(favorites, history);
        if (profile.isEmpty()) {
            return buildGeneralRecommendations(safeLimit);
        }

        return songRepository.findAll().stream()
                .filter(candidate -> !profile.favoriteSongIds().contains(candidate.getId()))
                .map(candidate -> scorePersonalCandidate(candidate, profile))
                .filter(item -> item.score() > 0)
                .sorted(Comparator
                        .comparingDouble(ScoredRecommendation::score).reversed()
                        .thenComparing(item -> safeName(item.response().getSongName()), String.CASE_INSENSITIVE_ORDER))
                .limit(safeLimit)
                .map(ScoredRecommendation::response)
                .collect(Collectors.toList());
    }

    private ScoredRecommendation scoreCandidate(
            Song target,
            Song candidate,
            Set<Long> targetPlaylistIds,
            String targetArtist,
            String targetGenre
    ) {
        double score = 0.0;
        List<String> reasons = new ArrayList<>();

        String candidateArtist = candidate.getArtist() != null ? normalize(candidate.getArtist().getName()) : "";
        String candidateGenre = candidate.getAlbum() != null ? normalize(candidate.getAlbum().getGenre()) : "";

        if (!targetArtist.isBlank() && targetArtist.equals(candidateArtist)) {
            score += 3.0;
            reasons.add("Ayn? sanat??");
        }

        if (!targetGenre.isBlank() && targetGenre.equals(candidateGenre)) {
            score += 2.0;
            reasons.add("Benzer t?r");
        }

        if (target.getAlbum() != null && candidate.getAlbum() != null
                && target.getAlbum().getId().equals(candidate.getAlbum().getId())) {
            score += 1.5;
            reasons.add("Ayn? alb?m");
        }

        double durationScore = durationSimilarity(target.getDuration(), candidate.getDuration());
        if (durationScore > 0.35) {
            score += durationScore * 1.5;
            reasons.add("Benzer s?re");
        }

        int overlap = commonPlaylistCount(targetPlaylistIds, playlistIds(candidate));
        if (overlap > 0) {
            score += Math.min(4.0, overlap * 2.0);
            reasons.add(overlap > 1 ? "Ayn? playlistlerde s?k ge?iyor" : "Ayn? playlistte birlikte ge?iyor");
        }

        RecommendationResponse response = new RecommendationResponse(
                candidate.getId(),
                candidate.getName(),
                candidate.getArtist() != null ? candidate.getArtist().getName() : "Bilinmeyen Sanat??",
                candidate.getCoverUrl(),
                candidate.getDuration(),
                candidate.getAudioUrl(),
                candidate.getExternalSource() == null ? "LOCAL" : candidate.getExternalSource(),
                Math.round(score * 100.0) / 100.0,
                reasons
        );

        return new ScoredRecommendation(score, response);
    }

    private ScoredRecommendation scorePersonalCandidate(Song candidate, RecommendationProfile profile) {
        double score = 0.0;
        List<String> reasons = new ArrayList<>();

        String artist = candidate.getArtist() != null ? normalize(candidate.getArtist().getName()) : "";
        String genre = candidate.getAlbum() != null ? normalize(candidate.getAlbum().getGenre()) : "";

        double artistWeight = artist.isBlank() ? 0.0 : profile.artistWeights().getOrDefault(artist, 0.0);
        if (artistWeight > 0) {
            score += Math.min(5.0, artistWeight * 1.25);
            reasons.add("Favori ve ge?mi?ine yak?n sanat??");
        }

        double genreWeight = genre.isBlank() ? 0.0 : profile.genreWeights().getOrDefault(genre, 0.0);
        if (genreWeight > 0) {
            score += Math.min(4.0, genreWeight);
            reasons.add("S?k dinledi?in t?re yak?n");
        }

        int playlistOverlap = commonPlaylistCount(profile.playlistIds(), playlistIds(candidate));
        if (playlistOverlap > 0) {
            score += Math.min(3.2, playlistOverlap * 1.2);
            reasons.add("Sevdi?in playlistlerle ?rt???yor");
        }

        if (profile.averageDuration() > 0) {
            double durationScore = durationSimilarity((int) Math.round(profile.averageDuration()), candidate.getDuration());
            if (durationScore > 0.35) {
                score += durationScore * 1.25;
                reasons.add("Dinleme al??kanl???na yak?n s?re");
            }
        }

        long historicalPlays = profile.historyPlayCounts().getOrDefault(candidate.getId(), 0L);
        if (historicalPlays > 0) {
            score -= Math.min(1.2, historicalPlays * 0.3);
        }

        if (score <= 0) {
            return new ScoredRecommendation(0.0, null);
        }

        RecommendationResponse response = new RecommendationResponse(
                candidate.getId(),
                candidate.getName(),
                candidate.getArtist() != null ? candidate.getArtist().getName() : "Bilinmeyen Sanat??",
                candidate.getCoverUrl(),
                candidate.getDuration(),
                candidate.getAudioUrl(),
                candidate.getExternalSource() == null ? "LOCAL" : candidate.getExternalSource(),
                Math.round(score * 100.0) / 100.0,
                reasons
        );

        return new ScoredRecommendation(score, response);
    }

    private RecommendationProfile buildProfile(List<Favorite> favorites, List<ListeningHistory> history) {
        Map<String, Double> artistWeights = new HashMap<>();
        Map<String, Double> genreWeights = new HashMap<>();
        Set<Long> playlistIds = new LinkedHashSet<>();
        Set<Long> favoriteSongIds = favorites.stream()
                .map(favorite -> favorite.getSong().getId())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Map<Long, Long> historyPlayCounts = new LinkedHashMap<>();

        double weightedDurationTotal = 0.0;
        double durationWeightTotal = 0.0;

        for (Favorite favorite : favorites) {
            Song song = favorite.getSong();
            accumulateSongPreferences(song, 3.0, artistWeights, genreWeights, playlistIds);
            weightedDurationTotal += song.getDuration() * 1.8;
            durationWeightTotal += 1.8;
        }

        for (ListeningHistory entry : history) {
            Song song = entry.getSong();
            historyPlayCounts.merge(song.getId(), 1L, Long::sum);
        }

        for (Map.Entry<Long, Long> entry : historyPlayCounts.entrySet()) {
            Song song = history.stream()
                    .map(ListeningHistory::getSong)
                    .filter(candidate -> candidate.getId().equals(entry.getKey()))
                    .findFirst()
                    .orElse(null);
            if (song == null) {
                continue;
            }

            double weight = Math.min(4.0, 0.8 + entry.getValue() * 0.7);
            accumulateSongPreferences(song, weight, artistWeights, genreWeights, playlistIds);
            weightedDurationTotal += song.getDuration() * weight;
            durationWeightTotal += weight;
        }

        double averageDuration = durationWeightTotal == 0 ? 0 : weightedDurationTotal / durationWeightTotal;

        return new RecommendationProfile(
                artistWeights,
                genreWeights,
                playlistIds,
                averageDuration,
                favoriteSongIds,
                historyPlayCounts
        );
    }

    private List<RecommendationResponse> buildGeneralRecommendations(int limit) {
        return songRepository.findAll().stream()
                .sorted(Comparator
                        .comparingInt((Song song) -> song.getPlaylists() == null ? 0 : song.getPlaylists().size())
                        .reversed()
                        .thenComparing(song -> safeName(song.getName()), String.CASE_INSENSITIVE_ORDER))
                .limit(limit)
                .map(song -> new RecommendationResponse(
                        song.getId(),
                        song.getName(),
                        song.getArtist() != null ? song.getArtist().getName() : "Bilinmeyen Sanat??",
                        song.getCoverUrl(),
                        song.getDuration(),
                        song.getAudioUrl(),
                        song.getExternalSource() == null ? "LOCAL" : song.getExternalSource(),
                        1.0,
                        List.of("K?t?phaneden ke?fetmeye uygun pop?ler par?a")
                ))
                .collect(Collectors.toList());
    }

    private void accumulateSongPreferences(
            Song song,
            double weight,
            Map<String, Double> artistWeights,
            Map<String, Double> genreWeights,
            Set<Long> playlistIds
    ) {
        if (song.getArtist() != null) {
            artistWeights.merge(normalize(song.getArtist().getName()), weight, Double::sum);
        }
        if (song.getAlbum() != null && song.getAlbum().getGenre() != null) {
            genreWeights.merge(normalize(song.getAlbum().getGenre()), Math.max(1.0, weight * 0.8), Double::sum);
        }
        playlistIds.addAll(playlistIds(song));
    }

    private Set<Long> playlistIds(Song song) {
        if (song.getPlaylists() == null) {
            return Set.of();
        }
        return song.getPlaylists().stream()
                .map(Playlist::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private int commonPlaylistCount(Set<Long> left, Set<Long> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (Long value : left) {
            if (right.contains(value)) {
                count++;
            }
        }
        return count;
    }

    private double durationSimilarity(int first, int second) {
        int difference = Math.abs(first - second);
        if (difference >= 180) {
            return 0.0;
        }
        return 1.0 - (difference / 180.0);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String safeName(String value) {
        return value == null ? "" : value;
    }

    private User getActiveUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullan?c? bulunamad?"));
    }

    private record RecommendationProfile(
            Map<String, Double> artistWeights,
            Map<String, Double> genreWeights,
            Set<Long> playlistIds,
            double averageDuration,
            Set<Long> favoriteSongIds,
            Map<Long, Long> historyPlayCounts
    ) {
        private boolean isEmpty() {
            return favoriteSongIds.isEmpty() && historyPlayCounts.isEmpty();
        }
    }

    private record ScoredRecommendation(double score, RecommendationResponse response) {
    }
}
