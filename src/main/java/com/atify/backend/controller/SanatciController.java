package com.atify.backend.controller;

import com.atify.backend.dto.SanatciRequest;
import com.atify.backend.service.SanatciService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.atify.backend.dto.SanatciResponse;


import java.util.List;

@RestController
@RequestMapping("/sanatcilar")
@RequiredArgsConstructor                        //cons tan kurtarır ama hata çıkarıyor gibi sanki arada
public class SanatciController {

    private final SanatciService sanatciService;

    @PostMapping
    public SanatciResponse sanatciEkle(@RequestBody SanatciRequest sanatciRequest) {                //SanatciRequest burada tip unutma
        return sanatciService.sanatciEkle(sanatciRequest);
    }

    @GetMapping
    public List<SanatciResponse> tumSanatcilariGetir() {
        return sanatciService.sanatcilariGetir();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> sanatciSil(@PathVariable Long id) {
        sanatciService.sanatciSil(id);  // Servis katmanına ilet
        return ResponseEntity.ok("Sanatçi başarıyla silindi");
    }
    @PutMapping("/{id}")
    public ResponseEntity<String> sanatciGuncelle(@PathVariable Long id, @RequestBody SanatciRequest request) {
        sanatciService.sanatciGuncelle(id, request);
        return ResponseEntity.ok("Sanatçı başarıyla güncellendi");
    }
}
