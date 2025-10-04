package com.japangular.quizzingbydoing.backendspeed.transcriptCards.repositories;

import com.japangular.quizzingbydoing.backendspeed.transcriptCards.entities.TranscriptStream;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranscriptStreamRepository extends JpaRepository<TranscriptStream, Long> {
  TranscriptStream findByFilenameAndVtuber(String filename, String vtuber);
  TranscriptStream findByStreamTitleAndVtuber(String streamTitle, String vtuber);
  Boolean existsByStreamTitleAndVtuber(String streamTitle, String vtuber);
}
