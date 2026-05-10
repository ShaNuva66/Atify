package com.atify.backend.service;

import com.atify.backend.dto.JamendoPreloadRunResponse;
import com.atify.backend.dto.JamendoPreloadSettingsResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JamendoPreloadServiceTest {

    @Mock SongService songService;
    @Mock JamendoPreloadSettingsService jamendoPreloadSettingsService;
    @Mock AuditLogService auditLogService;

    @InjectMocks JamendoPreloadService jamendoPreloadService;

    @Test
    void runPreloadNow_nullImportResponseIcinSifirSayacDoner() {
        when(jamendoPreloadSettingsService.getSettings())
                .thenReturn(new JamendoPreloadSettingsResponse(true, 4, List.of("chill")));
        when(songService.importJamendoSearchResults("chill", 4, "manual-run:chill"))
                .thenReturn(null);

        JamendoPreloadRunResponse result = jamendoPreloadService.runPreloadNow();

        assertThat(result.enabled()).isTrue();
        assertThat(result.imported()).isZero();
        assertThat(result.skipped()).isZero();
        assertThat(result.queries()).containsExactly("chill");
        verify(auditLogService).record(
                "JAMENDO_PRELOAD_RUN",
                "SYSTEM",
                null,
                "Jamendo preload manuel çalıştırıldı. imported=0, skipped=0"
        );
    }

    @Test
    void runPreloadNow_preloadKapaliysaImportCagirmaz() {
        when(jamendoPreloadSettingsService.getSettings())
                .thenReturn(new JamendoPreloadSettingsResponse(false, 4, List.of("chill")));

        JamendoPreloadRunResponse result = jamendoPreloadService.runPreloadNow();

        assertThat(result.enabled()).isFalse();
        assertThat(result.queryCount()).isEqualTo(1);
        assertThat(result.imported()).isZero();
        verify(songService, never()).importJamendoSearchResults(any(), anyInt(), any());
    }
}
