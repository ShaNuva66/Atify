package com.atify.backend.dto;

import java.time.LocalDate;

public class ArtistResponse {

    private Long id;
    private String name;
    private String country;
    private LocalDate birthDate;
    private String biography;
    private String profileImageUrl;

    public ArtistResponse() {
    }

    public ArtistResponse(Long id, String name, String country, LocalDate birthDate, String biography, String profileImageUrl) {
        this.id = id;
        this.name = name;
        this.country = country;
        this.birthDate = birthDate;
        this.biography = biography;
        this.profileImageUrl = profileImageUrl;
    }

    public ArtistResponse(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public String getBiography() { return biography; }
    public void setBiography(String biography) { this.biography = biography; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
}
