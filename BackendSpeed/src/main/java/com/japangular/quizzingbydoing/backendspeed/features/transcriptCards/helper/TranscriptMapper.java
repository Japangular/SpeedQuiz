package com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.helper;

import com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.apiModels.ApiStreamTranscript;
import com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.apiModels.ApiTranscriptRow;
import com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.entities.TranscriptRow;
import com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.entities.TranscriptStream;
import org.springframework.stereotype.Service;

@Service
public class TranscriptMapper {

  public TranscriptEntityContainer map(ApiStreamTranscript apiStreamTranscript) {
    TranscriptEntityContainer transcriptEntityContainer = new TranscriptEntityContainer();
    TranscriptStream streamInformation = mapTranscriptStream(apiStreamTranscript);
    transcriptEntityContainer.setTranscriptStream(streamInformation);
    transcriptEntityContainer.setTranscriptRows(apiStreamTranscript.getTranscripts().stream()
        .map(apiTranscriptRow -> mapTranscriptRow(apiTranscriptRow, streamInformation)).toList());
    return transcriptEntityContainer;
  }

  private TranscriptRow mapTranscriptRow(ApiTranscriptRow apiTranscriptRow, TranscriptStream stream) {
    TranscriptRow transcriptRow = new TranscriptRow();
    transcriptRow.setFromTimestamp(apiTranscriptRow.getFrom());
    transcriptRow.setToTimestamp(apiTranscriptRow.getTo());
    transcriptRow.setTranscript(apiTranscriptRow.getTranscript());
    transcriptRow.setStream(stream);
    return transcriptRow;
  }

  private TranscriptStream mapTranscriptStream(ApiStreamTranscript apiStreamTranscript) {
    TranscriptStream transcriptStream = new TranscriptStream();
    transcriptStream.setFilename(apiStreamTranscript.getFilename());
    transcriptStream.setStreamTitle(apiStreamTranscript.getStreamTitle());
    transcriptStream.setVtuber(apiStreamTranscript.getVtuber());
    return transcriptStream;
  }

}
