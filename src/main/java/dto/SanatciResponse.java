package com.atify.backend.dto;

import java.time.LocalDate;

public class SanatciResponse {

    private Long id;
    private String ad;
    private String ulke;
    private LocalDate dogumTarihi;
    private String biyografi;
    private String profilResmiUrl;

    public SanatciResponse() {
    }

    // Tüm alanları alan constructor
    public SanatciResponse(Long id, String ad, String ulke, LocalDate dogumTarihi, String biyografi, String profilResmiUrl) {
        this.id = id;
        this.ad = ad;
        this.ulke = ulke;
        this.dogumTarihi = dogumTarihi;
        this.biyografi = biyografi;
        this.profilResmiUrl = profilResmiUrl;
    }

    // Sadece id ve ad içeren constructor (getirme işlemi için)
    public SanatciResponse(Long id, String ad) {
        this.id = id;
        this.ad = ad;
    }

    // Getter & Setter’lar (otomatik tanıma için gerekli)

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAd() {
        return ad;
    }

    public void setAd(String ad) {
        this.ad = ad;
    }

    public String getUlke() {
        return ulke;
    }

    public void setUlke(String ulke) {
        this.ulke = ulke;
    }

    public LocalDate getDogumTarihi() {
        return dogumTarihi;
    }

    public void setDogumTarihi(LocalDate dogumTarihi) {
        this.dogumTarihi = dogumTarihi;
    }

    public String getBiyografi() {
        return biyografi;
    }

    public void setBiyografi(String biyografi) {
        this.biyografi = biyografi;
    }

    public String getProfilResmiUrl() {
        return profilResmiUrl;
    }

    public void setProfilResmiUrl(String profilResmiUrl) {
        this.profilResmiUrl = profilResmiUrl;
    }
}
