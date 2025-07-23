package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "sanatcilar")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sanatci {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ad;

    private String ulke;

    private LocalDate dogumTarihi;

    @Column(length = 1000)
    private String biyografi;

    private String profilResmiUrl;
}
