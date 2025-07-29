package com.atify.backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping
    public String test() {
        return "🎉 Token verified! Welcome, buddy!";
    }
}
