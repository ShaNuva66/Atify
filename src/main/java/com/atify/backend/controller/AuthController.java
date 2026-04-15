package com.atify.backend.controller;

import com.atify.backend.dto.LoginRequest;
import com.atify.backend.dto.LoginResponse;
import com.atify.backend.dto.UserProfileResponse;
import com.atify.backend.dto.UserProfileUpdateRequest;
import com.atify.backend.dto.UserRequest;
import com.atify.backend.entity.Role;
import com.atify.backend.entity.User;
import com.atify.backend.repository.UserRepository;
import com.atify.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // ---- Register ----
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username is required");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }
        if (userRepo.existsByUsername(request.getUsername().trim())) {
            throw new RuntimeException("This username is already taken.");
        }
        if (userRepo.existsByEmail(request.getEmail().trim())) {
            throw new RuntimeException("This email is already in use.");
        }

        User newUser = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(request.getPassword().trim()))
                .roles(Set.of(Role.USER))
                .build();

        userRepo.save(newUser);
        return ResponseEntity.ok("Registration successful");
    }

    // ---- Login ----
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        User user = userRepo.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse("Incorrect password", null, null));
        }

        String token = jwtService.generateToken(user.getUsername());
        String role = resolvePrimaryRole(user);

        return ResponseEntity.ok(new LoginResponse("Login successful", token, role));
    }

    // ---- Profil görüntüle ----
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(Principal principal) {
        User user = userRepo.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(toProfileResponse(user));
    }

    // ---- Profil güncelle ----
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            Principal principal,
            @RequestBody UserProfileUpdateRequest request
    ) {
        User user = userRepo.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            String newUsername = request.getUsername().trim();
            if (!user.getUsername().equals(newUsername) && userRepo.existsByUsername(newUsername)) {
                throw new RuntimeException("This username is already taken.");
            }
            user.setUsername(newUsername);
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim();
            if (!user.getEmail().equals(newEmail) && userRepo.existsByEmail(newEmail)) {
                throw new RuntimeException("This email is already in use.");
            }
            user.setEmail(newEmail);
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null
                    || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password is incorrect.");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User saved = userRepo.save(user);
        return ResponseEntity.ok(toProfileResponse(saved));
    }

    // ---- Helpers ----
    private String resolvePrimaryRole(User user) {
        Set<Role> roles = user.getRoles();
        if (roles != null && roles.contains(Role.ADMIN)) {
            return Role.ADMIN.name();
        }
        return Role.USER.name();
    }

    private UserProfileResponse toProfileResponse(User user) {
        Set<String> roleNames = user.getRoles() == null ? Set.of() :
                user.getRoles().stream().map(Role::name).collect(Collectors.toSet());
        return new UserProfileResponse(user.getId(), user.getUsername(), user.getEmail(), roleNames);
    }
}
