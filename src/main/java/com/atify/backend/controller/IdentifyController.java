package com.atify.backend.controller;

import com.atify.backend.dto.IdentifyResponse;
import com.atify.backend.service.RecognizeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequiredArgsConstructor
public class IdentifyController {

    private final RecognizeService recognizeService;

    // Shazam sayfası (butonlu arayüz)
    @GetMapping("/identify")
    public String identifyPage() {
        return "identify"; // src/main/resources/templates/identify.html
    }

    // Frontend JS'in çağıracağı API
    @PostMapping("/api/identify")
    @ResponseBody
    public ResponseEntity<IdentifyResponse> identify(@RequestParam("file") MultipartFile file) {
        try {
            IdentifyResponse resp = recognizeService.identifySong(file);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new IdentifyResponse(false, null, null, null));
        }
    }
}
