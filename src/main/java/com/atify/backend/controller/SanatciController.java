package com.atify.backend.controller;

import com.atify.backend.dto.SanatciRequest;
import com.atify.backend.dto.SanatciResponse;
import com.atify.backend.service.SanatciService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sanatcilar")
@RequiredArgsConstructor
public class SanatciController {

    private final SanatciService sanatciService;

    @PostMapping
    public SanatciResponse sanatciEkle(@RequestBody SanatciRequest sanatciRequest) {
        return sanatciService.sanatciEkle(sanatciRequest);
    }

    @GetMapping
    public List<SanatciResponse> tumSanatcilariGetir() {
        return sanatciService.sanatcilariGetir();
    }
}
