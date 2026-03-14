package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.services;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.entities.TranscriptRow;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.entities.TranscriptStream;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.exceptions.DuplicateTranscriptException;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.helper.TranscriptEntityContainer;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.repositories.TranscriptRowRepository;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.repositories.TranscriptStreamRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TranscriptPersistenceService {

  private final TranscriptStreamRepository transcriptStreamRepository;
  private final TranscriptRowRepository transcriptRowRepository;
  private static final Logger logger = LoggerFactory.getLogger(TranscriptPersistenceService.class);

  @Transactional
  public TranscriptEntityContainer save(TranscriptEntityContainer container) {
    TranscriptStream incomingStream = container.getTranscriptStream();
    String title = incomingStream.getStreamTitle();
    String vtuber =  incomingStream.getVtuber();

    checkWithException(title, vtuber);
    logger.info("Saving new transcript stream '{}' for vtuber '{}'", incomingStream.getStreamTitle(), incomingStream.getVtuber());

    TranscriptStream savedStream = transcriptStreamRepository.save(incomingStream);
    container.setTranscriptStream(savedStream);

    List<TranscriptRow> rows = container.getTranscriptRows().stream().peek(row -> row.setStream(savedStream)).collect(Collectors.toList());

    List<TranscriptRow> savedRows = transcriptRowRepository.saveAll(rows);

    container.setTranscriptRows(savedRows);
    logger.info("Saved {} transcript rows for stream '{}'", savedRows.size(), savedStream.getStreamTitle());
    return container;
  }

  public boolean check(String title, String vtuber) {
    return transcriptStreamRepository.existsByStreamTitleAndVtuber(title, vtuber);
  }

  public void checkWithException(String title, String vtuber) {
    if (check(title, vtuber)) {
      logger.info("Transcript stream '{}' for vtuber '{}' already exists", title, vtuber);
      throw new DuplicateTranscriptException("This stream has already been uploaded.");
    }
  }
}




