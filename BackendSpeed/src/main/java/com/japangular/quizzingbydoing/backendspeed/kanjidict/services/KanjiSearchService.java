package com.japangular.quizzingbydoing.backendspeed.kanjidict.services;

import com.japangular.quizzingbydoing.backendspeed.kanjidict.dto.KanjiDTO;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.entity.Kanji;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.exception.KanjiNotFoundException;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.repository.KanjiRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KanjiSearchService {
  private final KanjiRepository kanjiRepo;
  private static final Logger logger = LoggerFactory.getLogger(KanjiSearchService.class);

  public KanjiDTO toDto(Kanji kanji) {
    KanjiDTO dto = new KanjiDTO();
    dto.setKanji(kanji.getKanji());
    dto.setKunyomi(kanji.getKunyomi());
    dto.setOnyomi(kanji.getOnyomi());
    dto.setMeanings(kanji.getMeanings());
    return dto;
  }

  public List<KanjiDTO> getByKanji(String kanji) {
    Set<Character> uniqueKanjis = new HashSet<>();
    for (char c : kanji.toCharArray()) {
      if (isKanji(c)) {
        uniqueKanjis.add(c);
      }
    }

    List<KanjiDTO> kanjiList = new ArrayList<>();

    logger.info("Searching kanjis for input string: '{}', unique kanjis: {}", kanji, uniqueKanjis);

    for (Character c : uniqueKanjis) {
      Optional<Kanji> foundKanji;
      try {
        foundKanji = kanjiRepo.findByKanji(String.valueOf(c));
        if (foundKanji.isPresent()) {
          logger.debug("Found Kanji in DB: {}", foundKanji.get().getKanji());
          kanjiList.add(toDto(foundKanji.get()));
        } else {
          logger.warn("Kanji '{}' not found in database", c);
        }
      } catch (Exception e) {

        logger.error("Error fetching Kanji '{}' from database", c, e);
      }
    }
    return kanjiList;
  }

  private boolean isKanji(char c) {
    return (c >= '一' && c <= '龯') || (c >= '㐀' && c <= '䶿');
  }

  public List<KanjiDTO> getJouyou() {
    logger.info("Fetching Kanji with 'jouyou' tag");
    try {
      List<Kanji> results = kanjiRepo.findByTag("jouyou");
      logger.info("Found {} Kanjis with 'jouyou' tag", results.size());
      return results.stream().map(this::toDto).collect(Collectors.toList());
    } catch (Exception e) {
      logger.error("Error fetching 'jouyou' Kanjis from DB", e);
      return Collections.emptyList();
    }
  }
}

