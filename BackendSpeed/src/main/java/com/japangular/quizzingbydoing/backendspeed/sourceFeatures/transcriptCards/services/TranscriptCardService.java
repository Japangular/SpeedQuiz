package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.services;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.apiModels.ApiStreamTranscript;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.helper.TranscriptEntityContainer;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.helper.TranscriptMapper;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class TranscriptCardService {
  private static final Logger logger = LoggerFactory.getLogger(TranscriptCardService.class);

  private final TranscriptPersistenceService transcriptPersistenceService;
  private final TranscriptMapper transcriptMapper;

  public boolean processUpload(ApiStreamTranscript apiStreamTranscript) {
    logger.info("Processing upload request: {}", apiStreamTranscript);
    transcriptPersistenceService.checkWithException(apiStreamTranscript.getStreamTitle(), apiStreamTranscript.getVtuber());
    TranscriptEntityContainer persistedEntitiesContainer = transcriptPersistenceService.save(transcriptMapper.map(apiStreamTranscript));
    return persistedEntitiesContainer.getTranscriptRows().size() == apiStreamTranscript.getTranscripts().size();
  }

  public boolean check(String title, String vtuber){
    return this.transcriptPersistenceService.check(title, vtuber);
  }
}

