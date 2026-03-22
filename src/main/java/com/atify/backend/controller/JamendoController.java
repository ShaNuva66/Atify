package com.atify.backend.controller;

import com.atify.backend.dto.JamendoSearchResponse;
import com.atify.backend.service.JamendoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/jamendo")
@RequiredArgsConstructor
public class JamendoController {

    private final JamendoService jamendoService;

    @GetMapping("/search")
    public JamendoSearchResponse searchTracks(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return jamendoService.searchTracks(query, limit);
    }
}
