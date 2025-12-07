package com.atify.backend.service;

import com.atify.backend.dto.UserRequest;
import com.atify.backend.dto.LoginRequest;
import com.atify.backend.dto.LoginResponse;
import com.atify.backend.entity.User;
import com.atify.backend.entity.Role;
import com.atify.backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collections;

@Service  // this class is recognized by Spring as a service class
public class UserService {

    private final UserRepository userRepo;

    // Constructor: inject UserRepository
    public UserService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    // Register a new user
    public String register(UserRequest request) {

        // Check if username already exists
        if (userRepo.existsByUsername(request.getUsername())) {
            throw new RuntimeException("This username is already taken.");
        }

        // Check if email already exists
        if (userRepo.existsByEmail(request.getEmail())) {
            throw new RuntimeException("This email is already in use.");
        }

        // Encrypt the password (hashing)
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashedPassword = encoder.encode(request.getPassword());

        // Create new user entity
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        newUser.setPassword(hashedPassword);
        newUser.setRoles(Collections.singleton(Role.USER));  // default role: USER

        // Save to database
        userRepo.save(newUser);

        return "Registration successful.";
    }

    // User login
    public LoginResponse login(LoginRequest request) {

        // Check if user exists
        User foundUser = userRepo
                .findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found."));

        // Verify password
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        boolean passwordMatches = encoder.matches(request.getPassword(), foundUser.getPassword());

        if (!passwordMatches) {
            throw new RuntimeException("Incorrect password.");
        }

        // Dummy token for now (replace with JWT generation if needed)
        String token = "dummy-jwt-token";

        return new LoginResponse("Login successful.", token);
    }
}
