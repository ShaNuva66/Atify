package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class SanatciResponse {

    private Long id;
    private String ad;
    private String ulke;
    private LocalDate dogumTarihi;
    private String biyografi;
    private String profilResmiUrl;

}
