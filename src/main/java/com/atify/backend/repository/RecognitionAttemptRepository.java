package com.atify.backend.repository;

import com.atify.backend.entity.RecognitionAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecognitionAttemptRepository extends JpaRepository<RecognitionAttempt, Long> {

    Page<RecognitionAttempt> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByMatched(boolean matched);
}
