package com.atify.backend.controller;

import com.atify.backend.dto.IdentifyResponse;
import com.atify.backend.service.RecognizeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequiredArgsConstructor
public class IdentifyController {

    private final RecognizeService recognizeService;

    @GetMapping("/identify")
    public String identifyPage() {
        return "forward:/identify.html";
    }

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
