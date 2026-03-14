package com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.entity.Kanji;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.repository.KanjiRepository;
import com.japangular.quizzingbydoing.backendspeed.utils.JsonBatchImporter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KanjiImportService {
  private final KanjiRepository kanjiRepo;
  private volatile boolean imported = false;

  public void ensureImported() throws IOException {
    if (!imported && kanjiRepo.count() < 1) {
      importJson();
      imported = true;
    }
  }

  public Long getKanjiRepoCount() {
    return kanjiRepo.count();
  }

  public void importJson() throws IOException {
    for (String path : new String[]{"KANJIDIC_english/kanji_bank_1.json", "KANJIDIC_english/kanji_bank_2.json"}) {
      try (var in = getClass().getClassLoader().getResourceAsStream(path)) {
        if (in == null) {
          throw new IOException("Resource not found: " + path);
        }
        JsonBatchImporter.importJson(
            in,
            this::mapKanji,
            kanjiRepo::saveAll
        );
      }
    }
  }

  private Kanji mapKanji(JsonNode node) {

    String character = node.get(0).asText();
    String onyomiRaw = node.get(1).asText();
    String kunyomiRaw = node.get(2).asText();
    String tag = node.get(3).asText();

    List<String> meanings = new ArrayList<>();
    for (JsonNode m : node.get(4)) {
      meanings.add(m.asText());
    }

    Kanji k = new Kanji();
    k.setKanji(character);
    k.setOnyomi(Arrays.asList(onyomiRaw.split(" ")));
    k.setKunyomi(Arrays.asList(kunyomiRaw.split(" ")));
    k.setMeanings(meanings);

    if (!tag.isEmpty()) {
      k.setTags(List.of(tag));
    }

    return k;
  }
}
