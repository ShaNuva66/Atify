package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ad;
    private int yayinYili;

    @ManyToOne
    @JoinColumn(name = "sanatci_id")
    private Sanatci sanatci;
}
