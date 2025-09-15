package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.controller;

import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model.QrmTableResponse;
import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model.TableInformation;
import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model.UserTableStates;
import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.services.AnkiPersistenceService;
import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.services.FrontendCsvService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/anki")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
@RequiredArgsConstructor
public class AnkiController {
  private final FrontendCsvService frontendCsvService;
  private final AnkiPersistenceService ankiPersistenceService;
  private static final Logger logger = LoggerFactory.getLogger(AnkiController.class);

  @GetMapping("/questionReadingMeaning")
  public QrmTableResponse getFirstQuestion(@RequestParam(required = false) Integer limit, @RequestParam(required = false) Integer offset, @RequestParam(required = false) String questionFilter) {
    limit = limit == null ? 100 : limit;
    offset = offset == null ? 0 : offset;

    logger.info("limit: " + limit +  ", offset: " + offset);

    return new QrmTableResponse(
        frontendCsvService.getTablePage(limit, offset, questionFilter),
        new TableInformation(frontendCsvService.getFilteredQrmList(questionFilter).size(),
        new String[]{"index", "Question", "Reading", "Meaning"})
    );
  }

  @GetMapping("/tableInformation")
  public TableInformation totalQuestions() {
    return new TableInformation(frontendCsvService.totalQuestions(), new String[]{"index", "Question", "Reading", "Meaning"});
  }

  @PostMapping("/persistIgnoredAnkiRows")
  public ResponseEntity<String> persistIgnoredAnkiRows(@RequestBody UserTableStates userTableStates) {
    int total = userTableStates.getRowIds().length;
    ankiPersistenceService.overwritePersistIgnoredAnkiRows(userTableStates.getRowIds());
    logger.info("Persisted " + total + " ignored rows");

    return ResponseEntity.ok("Persisted " + total + " rows.");
  }

  @GetMapping("/getIgnoredAnkiRows")
  public UserTableStates getIgnoredAnkiRows() {
    return new UserTableStates(ankiPersistenceService.getIgnoredAnkiRowsId(), ankiPersistenceService.getCurrentDeckName());
  }


}
