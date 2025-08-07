package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.services;

import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model.QuestionReadingMeaning;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class FrontendService {
  private static final Logger logger = LoggerFactory.getLogger(FrontendService.class);

  private final FieldsToCsvService fieldsToCsvService;
  private List<QuestionReadingMeaning> qrmList;
  private int total = -1;

  AtomicInteger currentPosition = new AtomicInteger(1); // Starting position

  public int getNextUniqueIndex() {
    return currentPosition.getAndIncrement();
  }

  public FrontendService(FieldsToCsvService fieldsToCsvService) {
    this.fieldsToCsvService = fieldsToCsvService;
  }

  public List<QuestionReadingMeaning> getTablePage(int limit, int offset){
    if(qrmList==null){
      loadCsv();
    }
    List<QuestionReadingMeaning> result;
    if(qrmList.size() > offset + limit) {
      result = qrmList.subList(offset, offset + limit);
    } else {
      if(qrmList.size() > offset) {
        result = qrmList.subList(offset, qrmList.size());
      } else return new ArrayList<>();
    }
    logger.info(String.format("Loaded %d questions from csv", result.size()));
    return result;
  }

  private void loadCsv(){
    if (qrmList == null) {
      List<String[]> csv = fieldsToCsvService.loadAll();
      qrmList = csv.stream().map(a -> new QuestionReadingMeaning(getNextUniqueIndex()+"", a[1], a[2], a[3])).toList();
    }
  }

  public int totalQuestions() {
    if(total==-1){
      int t = fieldsToCsvService.totalQuestions();

      if(t == 0){
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
}
