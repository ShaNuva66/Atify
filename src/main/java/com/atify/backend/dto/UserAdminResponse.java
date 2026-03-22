package com.atify.backend.dto;

import java.util.Set;

public record UserAdminResponse(
        Long id,
        String username,
        String email,
        Set<String> roles
) {
}
