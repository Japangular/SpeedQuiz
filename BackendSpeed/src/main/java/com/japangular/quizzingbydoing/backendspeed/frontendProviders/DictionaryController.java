package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.model.Entry;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.service.DictionaryService;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/japaneseDict")
@AllArgsConstructor
public class DictionaryController {

  private final DictionaryService dictionaryService;
  private static final Logger logger = LoggerFactory.getLogger(DictionaryController.class);

  @GetMapping("/search")
  public List<Entry> search(@RequestParam String q) {
    List<Entry> foundEqualEntries = dictionaryService.searchEquals(q);
    logger.info("Search equals of key {} found {} entries", q, foundEqualEntries.size());
    return foundEqualEntries;
  }
}
