package com.atify.backend.repository;

import com.atify.backend.entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {

    boolean existsByName(String name);

    Optional<Artist> findByNameIgnoreCase(String name);

    List<Artist> findByNameContainingIgnoreCase(String name);
}
