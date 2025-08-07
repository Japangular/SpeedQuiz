package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.controller;

import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model.QrmTableResponse;
import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model.TableInformation;
import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.services.FrontendService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/anki")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
@RequiredArgsConstructor
public class AnkiController {
  private final FrontendService frontendService;
  private static final Logger logger = LoggerFactory.getLogger(AnkiController.class);

  @GetMapping("/questionReadingMeaning")
  public QrmTableResponse getFirstQuestion(@RequestParam(required = false) Integer limit, @RequestParam(required = false) Integer offset) {
    limit = limit == null ? 100 : limit;
    offset = offset == null ? 0 : offset;

    logger.info("limit: " + limit +  ", offset: " + offset);

    return new QrmTableResponse(frontendService.getTablePage(limit, offset), new TableInformation(frontendService.totalQuestions(), new String[]{"index", "Question", "Reading", "Meaning"}));
  }

  @GetMapping("/tableInformation")
  public TableInformation totalQuestions() {
    return new TableInformation(frontendService.totalQuestions(), new String[]{"index", "Question", "Reading", "Meaning"});
  }
}
