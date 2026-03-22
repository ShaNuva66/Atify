package com.atify.backend.service;

import com.atify.backend.entity.Role;
import com.atify.backend.entity.User;
import com.atify.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User userEntity = userRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Set<Role> roles = userEntity.getRoles() == null ? Collections.emptySet() : userEntity.getRoles();

        return org.springframework.security.core.userdetails.User.builder()
                .username(userEntity.getUsername())
                .password(userEntity.getPassword())
                .roles(roles.stream().map(Enum::name).toArray(String[]::new))
                .build();
    }
}
