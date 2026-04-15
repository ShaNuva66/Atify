package com.atify.backend.dto;

import java.util.List;

public class SearchResponse {

    private String query;
    private PageResponse<SongResponse> songs;
    private List<ArtistResponse> artists;
    private List<AlbumResponse> albums;

    public SearchResponse() {}

    public SearchResponse(String query,
                          PageResponse<SongResponse> songs,
                          List<ArtistResponse> artists,
                          List<AlbumResponse> albums) {
        this.query = query;
        this.songs = songs;
        this.artists = artists;
        this.albums = albums;
    }

    public String getQuery() { return query; }
    public PageResponse<SongResponse> getSongs() { return songs; }
    public List<ArtistResponse> getArtists() { return artists; }
    public List<AlbumResponse> getAlbums() { return albums; }
}
