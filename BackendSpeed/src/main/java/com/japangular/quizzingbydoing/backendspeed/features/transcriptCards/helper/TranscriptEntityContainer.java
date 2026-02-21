package com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.helper;

import com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.entities.TranscriptRow;
import com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.entities.TranscriptStream;
import lombok.Data;

import java.util.List;

@Data
public class TranscriptEntityContainer {
  TranscriptStream transcriptStream;
  List<TranscriptRow> transcriptRows;
}
