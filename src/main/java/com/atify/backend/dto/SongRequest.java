package com.atify.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class SongRequest {
    private String name;             // Şarkı adı
    private int duration;            // Süre (opsiyonel, 0 da olur)
    private Long artistId;           // ZORUNLU
    private Long albumId;            // OPSİYONEL - artık zorunlu değil
    private List<Long> playlistIdList; // OPSİYONEL
}
