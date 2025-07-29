package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AlbumResponse {
    private Long id;
    private String ad;
    private int yayinYili;
    private String sanatciAdi;
}
