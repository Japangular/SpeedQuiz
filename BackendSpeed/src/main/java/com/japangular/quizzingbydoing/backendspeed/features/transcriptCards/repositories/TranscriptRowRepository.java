package com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.repositories;

import com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.entities.TranscriptRow;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranscriptRowRepository extends JpaRepository<TranscriptRow, Long> {
}
