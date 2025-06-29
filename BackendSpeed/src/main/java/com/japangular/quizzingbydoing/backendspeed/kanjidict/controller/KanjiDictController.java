package com.japangular.quizzingbydoing.backendspeed.kanjidict.controller;

import com.japangular.quizzingbydoing.backendspeed.jm_dict_e.controller.DictionaryController;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.dto.KanjiDTO;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.entity.Kanji;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.services.KanjiImportService;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;


@RestController
@RequestMapping("/kanjiDict")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
@RequiredArgsConstructor
public class KanjiDictController {
  private final KanjiImportService kanjiImportService;

  static boolean firstTime = true;
  private static final Logger logger = LoggerFactory.getLogger(DictionaryController.class);

  @GetMapping("/search")
  public ResponseEntity<KanjiDTO> search(@RequestParam String k) throws IOException {
    logger.info("Kanji dict search started: " + k);
    if(checkFirst()) {
      logger.info("start import");
      this.kanjiImportService.importJson();
    }
    Kanji result = kanjiImportService.getByKanji(k);

    return ResponseEntity.ok(toDto(result));
  }

  private static Boolean checkFirst(){
    boolean result = firstTime;
    firstTime = false;
    return result;
  }

  public KanjiDTO toDto(Kanji kanji) {
    return new KanjiDTO(
        kanji.getId(),
        kanji.getKanji(),
        kanji.getOnyomi(),
        kanji.getKunyomi(),
        kanji.getMeanings(),
        kanji.getTags(),
        kanji.getMetadata()
    );
  }

}
