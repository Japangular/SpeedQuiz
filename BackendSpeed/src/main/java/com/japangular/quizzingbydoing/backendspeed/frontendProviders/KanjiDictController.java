package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.dto.KanjiDTO;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.services.KanjiImportService;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.services.KanjiSearchService;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.services.MecabService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/kanjiDict")
@RequiredArgsConstructor
public class KanjiDictController {
  private final KanjiImportService kanjiImportService;
  private final KanjiSearchService kanjiSearchService;
  private final MecabService mecabService;

  static boolean firstTime = true;
  private static final Logger logger = LoggerFactory.getLogger(KanjiDictController.class);

  @GetMapping("/search")
  public ResponseEntity<List<KanjiDTO>> search(@RequestParam String k) throws IOException {
    logger.info("Kanji dict search started: {}", k);
    if(kanjiImportService.getKanjiRepoCount() < 1) {
      logger.info("search request: Kanji dict needs to be imported, starting now");
      this.kanjiImportService.importJson();
    }
    logger.info("Searching out of " + kanjiImportService.getKanjiRepoCount());
    return ResponseEntity.ok(kanjiSearchService.getByKanji(k));
  }

  @GetMapping("/jouyou")
  public ResponseEntity<List<KanjiDTO>> jouyou() throws IOException {
    logger.info("Progressing Jouyou Kanji request");
    if (checkFirst()) {
      logger.info("jouyou request: Kanji dict needs to be imported, starting now");
      this.kanjiImportService.importJson();
    }
    logger.info("Searching out of " + kanjiImportService.getKanjiRepoCount());
    logger.info("Finished: returning jouyou Kanji");
    return ResponseEntity.ok(kanjiSearchService.getJouyou());
  }

  @GetMapping("/parseMecab")
  public ResponseEntity<List<Map<String, Object>>> parseMecab(@RequestParam String k) throws IOException {
    logger.info("Kanji dict parseMecab started: {}", k);

    // Get the parsed data
    List<Map<String, Object>> parsedData = mecabService.parseJapaneseToJson(k);

    // Return parsed data as JSON response
    return ResponseEntity.ok(parsedData);
  }

  private static Boolean checkFirst(){
    boolean result = firstTime;
    firstTime = false;
    return result;
  }

}
