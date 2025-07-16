package com.atify.backend.controller;

import com.atify.backend.entity.Sanatci;
import com.atify.backend.repository.SanatciRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sanatcilar")
@RequiredArgsConstructor
public class SanatciController {

    private final SanatciRepository sanatciRepository;

    @PostMapping
    public Sanatci sanatciEkle(@RequestBody Sanatci sanatci) {
        return sanatciRepository.save(sanatci);
    }

    @GetMapping
    public List<Sanatci> tumSanatcilariGetir() {
        return sanatciRepository.findAll();
    }
}
