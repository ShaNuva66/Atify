package com.atify.backend;

import com.atify.backend.dto.SongResponse;
import com.atify.backend.dto.UserAdminResponse;
import com.atify.backend.service.AdminUserService;
import com.atify.backend.service.AuditLogService;
import com.atify.backend.service.SongService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAccessTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SongService songService;

    @MockBean
    private AdminUserService adminUserService;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    void authLoginEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"x\",\"password\":\"y\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void songsGet_isPublic() throws Exception {
        when(songService.getAllSongs()).thenReturn(List.of(new SongResponse(1L, "s", 100, "artist", null, null, "LOCAL")));

        mockMvc.perform(get("/songs"))
                .andExpect(status().isOk());
    }

    @Test
    void songsDelete_requiresAdmin() throws Exception {
        mockMvc.perform(delete("/songs/1")
                        .with(SecurityMockMvcRequestPostProcessors.user("u").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void songsDelete_withAdmin_reachesControllerLayer() throws Exception {
        mockMvc.perform(delete("/songs/1")
                        .with(SecurityMockMvcRequestPostProcessors.user("a").roles("ADMIN")))
                .andExpect(status().isNoContent());
    }

    @Test
    void artistsPost_requiresAdmin() throws Exception {
        mockMvc.perform(post("/artists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\"}")
                        .with(SecurityMockMvcRequestPostProcessors.user("u").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void jamendoImport_requiresAdmin() throws Exception {
        mockMvc.perform(post("/songs/import/jamendo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jamendoId\":\"123\",\"name\":\"n\",\"artistName\":\"a\",\"audioUrl\":\"https://x\"}")
                        .with(SecurityMockMvcRequestPostProcessors.user("u").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void usersGet_requiresAdmin() throws Exception {
        mockMvc.perform(get("/users")
                        .with(SecurityMockMvcRequestPostProcessors.user("u").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void usersDelete_requiresAdmin() throws Exception {
        mockMvc.perform(delete("/users/1")
                        .with(SecurityMockMvcRequestPostProcessors.user("u").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void usersRoleUpdate_withAdmin_reachesControllerLayer() throws Exception {
        when(adminUserService.updatePrimaryRole(1L, "ADMIN"))
                .thenReturn(new UserAdminResponse(1L, "u", "u@test.com", java.util.Set.of("ADMIN")));

        mockMvc.perform(put("/users/1/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}")
                        .with(SecurityMockMvcRequestPostProcessors.user("a").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void auditLogsGet_requiresAdmin() throws Exception {
        mockMvc.perform(get("/audit-logs")
                        .with(SecurityMockMvcRequestPostProcessors.user("u").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void auditLogsExport_requiresAdmin() throws Exception {
        mockMvc.perform(get("/audit-logs/export")
                        .with(SecurityMockMvcRequestPostProcessors.user("u").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void auditLogsGet_withAdmin_reachesControllerLayer() throws Exception {
        mockMvc.perform(get("/audit-logs")
                        .with(SecurityMockMvcRequestPostProcessors.user("a").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void auditLogsFiltered_withAdmin_reachesControllerLayer() throws Exception {
        mockMvc.perform(get("/audit-logs")
                        .param("actor", "Adminati")
                        .param("action", "USER_DELETED")
                        .param("q", "temp")
                        .with(SecurityMockMvcRequestPostProcessors.user("a").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void auditLogsExport_withAdmin_reachesControllerLayer() throws Exception {
        mockMvc.perform(get("/audit-logs/export")
                        .param("actor", "Adminati")
                        .with(SecurityMockMvcRequestPostProcessors.user("a").roles("ADMIN")))
                .andExpect(status().isOk());
    }
}
