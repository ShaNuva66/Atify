package com.atify.backend.dto;

import java.time.LocalDate;

public class SanatciRequest {

    private String ad;
    private String ulke;
    private LocalDate dogumTarihi;
    private String biyografi;
    private String profilResmiUrl;

    public SanatciRequest() {
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
