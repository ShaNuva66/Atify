package com.atify.backend.service;

import com.atify.backend.dto.ArtistRequest;
import com.atify.backend.dto.ArtistResponse;
import com.atify.backend.entity.Artist;
import com.atify.backend.repository.ArtistRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArtistServiceTest {

    @Mock ArtistRepository artistRepo;
    @Mock AuditLogService auditLogService;

    @InjectMocks ArtistService artistService;

    // ---- getAllArtists ----

    @Test
    void getAllArtists_bosDatabasede_bosListeDoner() {
        when(artistRepo.findAll()).thenReturn(List.of());

        List<ArtistResponse> result = artistService.getAllArtists();

        assertThat(result).isEmpty();
    }

    @Test
    void getAllArtists_veriVarsa_dogruMapler() {
        Artist a = Artist.builder()
                .id(1L).name("Test Sanatçı").country("TR")
                .birthDate(LocalDate.of(1990, 1, 1))
                .biography("Bio").profileImageUrl("http://img.com")
                .build();
        when(artistRepo.findAll()).thenReturn(List.of(a));

        List<ArtistResponse> result = artistService.getAllArtists();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Sanatçı");
        assertThat(result.get(0).getCountry()).isEqualTo("TR");
    }

    // ---- addArtist ----

    @Test
    void addArtist_aynıIsimVarsa_exception() {
        when(artistRepo.existsByName("Mevcut Sanatçı")).thenReturn(true);

        ArtistRequest request = new ArtistRequest();
        request.setName("Mevcut Sanatçı");

        assertThatThrownBy(() -> artistService.addArtist(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void addArtist_yeniSanatci_kaydedilir() {
        when(artistRepo.existsByName("Yeni Sanatçı")).thenReturn(false);

        ArtistRequest request = new ArtistRequest();
        request.setName("Yeni Sanatçı");
        request.setCountry("DE");

        Artist saved = Artist.builder().id(5L).name("Yeni Sanatçı").country("DE").build();
        when(artistRepo.save(any(Artist.class))).thenReturn(saved);

        ArtistResponse result = artistService.addArtist(request);

        assertThat(result.getId()).isEqualTo(5L);
        assertThat(result.getName()).isEqualTo("Yeni Sanatçı");
        verify(auditLogService).record(eq("ARTIST_CREATED"), eq("ARTIST"), eq(5L), any());
    }

    // ---- deleteArtist ----

    @Test
    void deleteArtist_sanatciYoksa_exception() {
        when(artistRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> artistService.deleteArtist(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void deleteArtist_gecerli_silinir() {
        Artist artist = Artist.builder().id(1L).name("Silinecek").build();
        when(artistRepo.findById(1L)).thenReturn(Optional.of(artist));

        artistService.deleteArtist(1L);

        verify(artistRepo).delete(artist);
        verify(auditLogService).record(eq("ARTIST_DELETED"), eq("ARTIST"), eq(1L), any());
    }

    // ---- updateArtist ----

    @Test
    void updateArtist_sanatciYoksa_exception() {
        when(artistRepo.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> artistService.updateArtist(404L, new ArtistRequest()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void updateArtist_gecerli_guncellenir() {
        Artist existing = Artist.builder().id(2L).name("Eski İsim").build();
        when(artistRepo.findById(2L)).thenReturn(Optional.of(existing));

        ArtistRequest request = new ArtistRequest();
        request.setName("Yeni İsim");
        request.setCountry("US");

        Artist updated = Artist.builder().id(2L).name("Yeni İsim").country("US").build();
        when(artistRepo.save(any())).thenReturn(updated);

        ArtistResponse result = artistService.updateArtist(2L, request);

        assertThat(result.getName()).isEqualTo("Yeni İsim");
        assertThat(result.getCountry()).isEqualTo("US");
        verify(auditLogService).record(eq("ARTIST_UPDATED"), eq("ARTIST"), eq(2L), any());
    }
}
