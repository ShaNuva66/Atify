package com.atify.backend.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jamendo")
public class JamendoProperties {

    private String clientId;
    private final Preload preload = new Preload();

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public Preload getPreload() {
        return preload;
    }

    public static class Preload {
        private boolean enabled;
        private int limit = 4;
        private List<String> queries = new ArrayList<>();

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public int getLimit() {
            return limit;
        }

        public void setLimit(int limit) {
            this.limit = limit;
        }

        public List<String> getQueries() {
            return queries;
        }

        public void setQueries(List<String> queries) {
            this.queries = queries == null ? new ArrayList<>() : queries;
        }
    }
}
