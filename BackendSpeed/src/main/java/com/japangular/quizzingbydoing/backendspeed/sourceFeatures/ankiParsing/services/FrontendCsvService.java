package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.services;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.model.QuestionReadingMeaning;
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
  private int total = -1;

  AtomicInteger currentPosition = new AtomicInteger(1); // Starting position

  public int getNextUniqueIndex() {
    return currentPosition.getAndIncrement();
  }

  public FrontendCsvService(FieldsToCsvService fieldsToCsvService) {
    this.fieldsToCsvService = fieldsToCsvService;
  }

  public List<QuestionReadingMeaning> getFilteredQrmList(String questionFilter) {
    if (qrmList == null) {
      loadCsv();
    }
    if (questionFilter != null && !questionFilter.trim().isEmpty()) {
      return qrmList.stream().filter(q -> q.getQuestion().contains(questionFilter)).toList();
    } else {
      return qrmList;
    }
  }

  public List<QuestionReadingMeaning> getTablePage(int limit, int offset, String questionFilter) {
    if (qrmList == null) {
      loadCsv();
    }
    List<QuestionReadingMeaning> questionReadingMeanings = qrmList;
    List<QuestionReadingMeaning> result;
    if (questionFilter != null && !questionFilter.trim().isEmpty()) {
      questionReadingMeanings = qrmList.stream().filter(q -> q.getQuestion().contains(questionFilter)).toList();
    }
    if (questionReadingMeanings.size() > offset + limit) {
      result = questionReadingMeanings.subList(offset, offset + limit);
    } else {
      if (questionReadingMeanings.size() > offset) {
        result = questionReadingMeanings.subList(offset, questionReadingMeanings.size());
      } else return new ArrayList<>();
    }
    logger.info("Loaded {} questions from csv", result.size());
    return result;
  }

  private void loadCsv() {
    if (qrmList == null) {
      List<String[]> csv = fieldsToCsvService.loadAll();
      qrmList = csv.stream().map(a -> new QuestionReadingMeaning(getNextUniqueIndex() + "", a[1], a[2], a[3])).toList();
    }
  }

  public int totalQuestions() {
    if (total == -1) {
      int t = fieldsToCsvService.totalQuestions();

      if (t == 0) {
        total = 0;
        return total;
      }

      String[] first = fieldsToCsvService.getCsv(1, 0).getFirst();
      if ((first[2] == null || first[2].isEmpty()) && (first[3] == null || first[3].isEmpty())) {
        t--;
      }
      total = t;
    }
    return total;
  }

  public List<QuestionReadingMeaning> getFilteredQuestions(String kanji) {
    return qrmList.stream().filter(qrm -> qrm.getQuestion().contains(kanji)).toList();
  }
}
