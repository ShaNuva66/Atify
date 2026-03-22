package com.atify.backend.controller;

import com.atify.backend.dto.UserAdminResponse;
import com.atify.backend.dto.UserRoleUpdateRequest;
import com.atify.backend.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<UserAdminResponse> getUsers() {
        return adminUserService.getAllUsers();
    }

    @PutMapping("/{userId}/role")
    public UserAdminResponse updateRole(
            @PathVariable Long userId,
            @RequestBody UserRoleUpdateRequest request
    ) {
        return adminUserService.updatePrimaryRole(userId, request.getRole());
    }

    @DeleteMapping("/{userId}")
    public void deleteUser(@PathVariable Long userId) {
        adminUserService.deleteUser(userId);
    }
}
