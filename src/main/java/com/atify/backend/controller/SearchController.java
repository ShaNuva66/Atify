package com.atify.backend.controller;

import com.atify.backend.dto.SearchResponse;
import com.atify.backend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * Global arama: şarkı adı, sanatçı adı ve albüm adında arar.
     *
     * GET /search?q=bohemian&page=0&size=10
     */
    @GetMapping
    public SearchResponse search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return searchService.search(q, page, size);
    }
}
