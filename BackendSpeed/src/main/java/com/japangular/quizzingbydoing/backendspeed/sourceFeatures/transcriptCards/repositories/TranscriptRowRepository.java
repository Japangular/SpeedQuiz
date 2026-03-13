package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.repositories;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.entities.TranscriptRow;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranscriptRowRepository extends JpaRepository<TranscriptRow, Long> {
}
