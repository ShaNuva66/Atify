package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Table(name = "app_user") // ✅ PostgreSQL reserved keyword 'user' yerine 'app_user' kullandık
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;  // kullaniciAdi

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;  // sifre (hashed)

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    private Set<Role> roles;
}
