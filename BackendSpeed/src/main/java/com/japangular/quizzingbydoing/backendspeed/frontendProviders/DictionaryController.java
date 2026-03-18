package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.EntryMapper;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.model.Entry;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.model.EntryDto;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.service.DictionaryService;
import jakarta.validation.constraints.Size;
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
  public List<EntryDto> search(@RequestParam @Size(min = 1, max = 100) String q) {
    List<EntryDto> results = dictionaryService.searchEquals(q).stream()
        .map(EntryMapper::toDto)
        .toList();
    logger.info("Search equals of key '{}' found {} entries", q, results.size());
    return results;
  }
}
