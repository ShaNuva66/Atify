package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SongResponse {
    private Long id;
    private String name;
    private int duration;
}
