package com.atify.backend.service;

import com.atify.backend.dto.UserAdminResponse;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Role;
import com.atify.backend.entity.User;
import com.atify.backend.repository.FavoriteRepository;
import com.atify.backend.repository.ListeningHistoryRepository;
import com.atify.backend.repository.PlaylistRepository;
import com.atify.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final FavoriteRepository favoriteRepository;
    private final ListeningHistoryRepository listeningHistoryRepository;
    private final AuditLogService auditLogService;

    public List<UserAdminResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse)
                .toList();
    }

    public UserAdminResponse updatePrimaryRole(Long userId, String requestedRole) {
        if (requestedRole == null || requestedRole.isBlank()) {
            throw new RuntimeException("Role is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role targetRole;
        try {
            targetRole = Role.valueOf(requestedRole.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid role");
        }

        String activeUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        if (activeUsername.equals(user.getUsername()) && targetRole == Role.USER) {
            throw new RuntimeException("Kendi admin rolünü bu ekrandan kaldıramazsın.");
        }

        boolean userIsAdmin = user.getRoles() != null && user.getRoles().contains(Role.ADMIN);
        if (userIsAdmin && targetRole == Role.USER && countAdmins() <= 1) {
            throw new RuntimeException("Sistemde en az bir admin kalmalı.");
        }

        user.setRoles(EnumSet.of(targetRole));
        User savedUser = userRepository.save(user);
        auditLogService.record(
                "USER_ROLE_UPDATED",
                "USER",
                savedUser.getId(),
                savedUser.getUsername() + " kullanıcısının rolü " + targetRole.name() + " olarak güncellendi."
        );
        return toResponse(savedUser);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String activeUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        if (activeUsername.equals(user.getUsername())) {
            throw new RuntimeException("Kendi hesabını bu ekrandan silemezsin.");
        }

        boolean userIsAdmin = user.getRoles() != null && user.getRoles().contains(Role.ADMIN);
        if (userIsAdmin && countAdmins() <= 1) {
            throw new RuntimeException("Son admin kullanıcı silinemez.");
        }

        favoriteRepository.deleteAllByUser(user);
        listeningHistoryRepository.deleteAllByUser(user);

        List<Playlist> playlists = new ArrayList<>(playlistRepository.findByUser(user));
        for (Playlist playlist : playlists) {
            if (playlist.getSongs() != null) {
                playlist.getSongs().clear();
            }
        }
        playlistRepository.saveAll(playlists);
        playlistRepository.deleteAll(playlists);

        Long deletedUserId = user.getId();
        String deletedUsername = user.getUsername();
        Set<Role> deletedRoles = user.getRoles() == null ? Set.of() : Set.copyOf(user.getRoles());

        userRepository.delete(user);

        auditLogService.record(
                "USER_DELETED",
                "USER",
                deletedUserId,
                deletedUsername + " kullanıcısı silindi. Roller: " + deletedRoles
        );
    }

    private long countAdmins() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && user.getRoles().contains(Role.ADMIN))
                .count();
    }

    private UserAdminResponse toResponse(User user) {
        Set<String> roles = (user.getRoles() == null ? Set.<Role>of() : user.getRoles()).stream()
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));

        return new UserAdminResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roles
        );
    }
}
