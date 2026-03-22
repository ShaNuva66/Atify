package com.atify.backend.service;

import com.atify.backend.dto.ArtistInsightResponse;
import com.atify.backend.dto.JamendoImportRequest;
import com.atify.backend.dto.ListeningHistoryResponse;
import com.atify.backend.dto.ListeningStatsResponse;
import com.atify.backend.entity.ListeningHistory;
import com.atify.backend.entity.Song;
import com.atify.backend.entity.User;
import com.atify.backend.repository.FavoriteRepository;
import com.atify.backend.repository.ListeningHistoryRepository;
import com.atify.backend.repository.SongRepository;
import com.atify.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ListeningHistoryService {

    private final ListeningHistoryRepository listeningHistoryRepository;
    private final FavoriteRepository favoriteRepository;
    private final SongRepository songRepository;
    private final UserRepository userRepository;
    private final SongService songService;

    public void recordPlay(Long songId) {
        User user = getActiveUser();
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        listeningHistoryRepository.save(ListeningHistory.builder()
                .user(user)
                .song(song)
                .listenedAt(LocalDateTime.now())
                .build());
    }

    public void recordJamendoPlay(JamendoImportRequest request) {
        Song song = songService.importJamendoTrack(request);
        recordPlay(song.getId());
    }

    public List<ListeningHistoryResponse> getRecentHistory(int limit) {
        User user = getActiveUser();
        List<ListeningHistory> history = listeningHistoryRepository.findAllByUserOrderByListenedAtDesc(user);

        Map<Long, ListeningHistoryResponse> uniqueBySong = new LinkedHashMap<>();
        for (ListeningHistory entry : history) {
            Song song = entry.getSong();
            if (!uniqueBySong.containsKey(song.getId())) {
                uniqueBySong.put(song.getId(), toResponse(song, 1, entry.getListenedAt()));
            }
            if (uniqueBySong.size() >= Math.max(1, limit)) {
                break;
            }
        }
        return uniqueBySong.values().stream().toList();
    }

    public List<ListeningHistoryResponse> getTopHistory(int limit) {
        User user = getActiveUser();
        List<ListeningHistory> history = listeningHistoryRepository.findAllByUserOrderByListenedAtDesc(user);

        Map<Long, HistoryAggregate> aggregates = new LinkedHashMap<>();
        for (ListeningHistory entry : history) {
            Song song = entry.getSong();
            HistoryAggregate aggregate = aggregates.computeIfAbsent(song.getId(), key -> new HistoryAggregate(song));
            aggregate.playCount++;
            if (aggregate.lastListenedAt == null || entry.getListenedAt().isAfter(aggregate.lastListenedAt)) {
                aggregate.lastListenedAt = entry.getListenedAt();
            }
        }

        return aggregates.values().stream()
                .sorted((a, b) -> Long.compare(b.playCount, a.playCount))
                .limit(Math.max(1, limit))
                .map(a -> toResponse(a.song, a.playCount, a.lastListenedAt))
                .toList();
    }

    public ListeningStatsResponse getStats() {
        User user = getActiveUser();
        List<ListeningHistory> history = listeningHistoryRepository.findAllByUserOrderByListenedAtDesc(user);
        long favoriteCount = favoriteRepository.findAllByUserOrderByCreatedAtDesc(user).size();

        long totalPlays = history.size();
        long uniqueSongs = history.stream()
                .map(entry -> entry.getSong().getId())
                .distinct()
                .count();
        long localPlayCount = history.stream()
                .filter(entry -> !"JAMENDO".equalsIgnoreCase(entry.getSong().getExternalSource()))
                .count();
        long jamendoPlayCount = history.stream()
                .filter(entry -> "JAMENDO".equalsIgnoreCase(entry.getSong().getExternalSource()))
                .count();

        Map<String, Long> artistCounts = buildArtistCounts(history);
        Map.Entry<String, Long> topArtist = artistCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        LocalDateTime lastListenedAt = history.isEmpty() ? null : history.get(0).getListenedAt();

        return new ListeningStatsResponse(
                totalPlays,
                uniqueSongs,
                favoriteCount,
                topArtist != null ? topArtist.getKey() : null,
                topArtist != null ? topArtist.getValue() : 0,
                localPlayCount,
                jamendoPlayCount,
                lastListenedAt
        );
    }

    public List<ArtistInsightResponse> getTopArtists(int limit) {
        User user = getActiveUser();
        List<ListeningHistory> history = listeningHistoryRepository.findAllByUserOrderByListenedAtDesc(user);
        Map<String, Long> artistCounts = buildArtistCounts(history);

        return artistCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry::getKey, String.CASE_INSENSITIVE_ORDER))
                .limit(Math.max(1, limit))
                .map(entry -> new ArtistInsightResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    private ListeningHistoryResponse toResponse(Song song, long playCount, LocalDateTime lastListenedAt) {
        return new ListeningHistoryResponse(
                song.getId(),
                song.getName(),
                song.getArtist() != null ? song.getArtist().getName() : null,
                song.getDuration(),
                song.getCoverUrl(),
                song.getAudioUrl(),
                song.getExternalSource() == null ? "LOCAL" : song.getExternalSource(),
                playCount,
                lastListenedAt
        );
    }

    private Map<String, Long> buildArtistCounts(List<ListeningHistory> history) {
        Map<String, Long> artistCounts = new HashMap<>();
        for (ListeningHistory entry : history) {
            Song song = entry.getSong();
            String artistName = song.getArtist() != null && song.getArtist().getName() != null
                    ? song.getArtist().getName()
                    : "Bilinmeyen Sanatçı";
            artistCounts.merge(artistName, 1L, Long::sum);
        }
        return artistCounts;
    }

    private User getActiveUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private static class HistoryAggregate {
        private final Song song;
        private long playCount;
        private LocalDateTime lastListenedAt;

        private HistoryAggregate(Song song) {
            this.song = song;
        }
    }
}
