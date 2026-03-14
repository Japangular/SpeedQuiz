package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjiDetails.model.KanjiDetails;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjiDetails.services.KanjiDetailService;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/kanjiDetail")
@AllArgsConstructor
public class KanjiDetailController {
  private final KanjiDetailService kanjiDetailService;
  private static final Logger logger = LoggerFactory.getLogger(KanjiDetailController.class);

  @GetMapping("/information/{kanji}")
  public KanjiDetails getKanjiDetails(@PathVariable String kanji) {
    logger.info(kanji);
    return kanjiDetailService.getDetails(kanji);
  }
}
