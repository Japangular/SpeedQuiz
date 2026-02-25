package com.japangular.quizzingbydoing.backendspeed.features.kanjiDetails.services;

import com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.model.QuestionReadingMeaning;
import com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.services.FrontendCsvService;
import com.japangular.quizzingbydoing.backendspeed.features.kanjiDetails.model.KanjiDetails;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class KanjiDetailService {
  private final FrontendCsvService frontendCsvService;

  public KanjiDetails getDetails(String kanji){
    List<QuestionReadingMeaning> matches = frontendCsvService.getFilteredQuestions(kanji);
    return new KanjiDetails();
  }
}
