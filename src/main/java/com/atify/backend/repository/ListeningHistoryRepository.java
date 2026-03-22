package com.atify.backend.repository;

import com.atify.backend.entity.ListeningHistory;
import com.atify.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListeningHistoryRepository extends JpaRepository<ListeningHistory, Long> {

    List<ListeningHistory> findAllByUserOrderByListenedAtDesc(User user);

    void deleteAllByUser(User user);
}
