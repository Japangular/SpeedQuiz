package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.services;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.model.QuestionReadingMeaning;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class FrontendCsvService {
  private static final Logger logger = LoggerFactory.getLogger(FrontendCsvService.class);

  private final FieldsToCsvService fieldsToCsvService;
  private List<QuestionReadingMeaning> qrmList;

  public FrontendCsvService(FieldsToCsvService fieldsToCsvService) {
    this.fieldsToCsvService = fieldsToCsvService;
  }

  @PostConstruct
  void init() {
    this.qrmList = loadCsv();
    logger.info("Loaded {} cards from Anki CSV", qrmList.size());
  }

  private List<QuestionReadingMeaning> loadCsv() {
    AtomicInteger counter = new AtomicInteger(1);
    List<String[]> csv = fieldsToCsvService.loadAll();
    return csv.stream()
        .map(a -> new QuestionReadingMeaning(counter.getAndIncrement() + "", a[1], a[2], a[3]))
        .toList();
  }

  public List<QuestionReadingMeaning> getFilteredQrmList(String questionFilter) {
    if (questionFilter != null && !questionFilter.trim().isEmpty()) {
      return qrmList.stream().filter(q -> q.getQuestion().contains(questionFilter)).toList();
    }
    return qrmList;
  }

  public List<QuestionReadingMeaning> getTablePage(int limit, int offset, String questionFilter) {
    List<QuestionReadingMeaning> source = getFilteredQrmList(questionFilter);
    int fromIndex = Math.min(offset, source.size());
    int toIndex = Math.min(offset + limit, source.size());
    return source.subList(fromIndex, toIndex);
  }

  public int totalQuestions() {
    return qrmList.size();
  }

  public List<QuestionReadingMeaning> getFilteredQuestions(String kanji) {
    return qrmList.stream().filter(qrm -> qrm.getQuestion().contains(kanji)).toList();
  }
}
