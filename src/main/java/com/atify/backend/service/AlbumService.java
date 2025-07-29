package com.atify.backend.service;

import com.atify.backend.dto.AlbumRequest;
import com.atify.backend.dto.AlbumResponse;
import com.atify.backend.entity.Album;
import com.atify.backend.entity.Sanatci;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.SanatciRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepo;
    private final SanatciRepository sanatciRepo;

    public AlbumResponse albumEkle(AlbumRequest request) {
        Sanatci sanatci = sanatciRepo.findById(request.getSanatciId())
                .orElseThrow(() -> new RuntimeException("Sanatçı bulunamadı"));

        Album album = Album.builder()
                .ad(request.getAd())
                .yayinYili(request.getYayinYili())
                .sanatci(sanatci)
                .build();

        albumRepo.save(album);

        return new AlbumResponse(album.getId(), album.getAd(), album.getYayinYili(), sanatci.getAd());
    }

    public List<AlbumResponse> tumAlbumleriGetir() {
        return albumRepo.findAll().stream()
                .map(a -> new AlbumResponse(a.getId(), a.getAd(), a.getYayinYili(), a.getSanatci().getAd()))
                .toList();
    }
}
