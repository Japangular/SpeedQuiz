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
    // Step 1: Convert the string to a Set of unique kanji characters (filtering non-kanji characters)
    Set<Character> uniqueKanjis = new HashSet<>();
    for (char c : kanji.toCharArray()) {
      if (isKanji(c)) {  // Step 2: Only process valid kanji characters
        uniqueKanjis.add(c); // Automatically handles uniqueness
      }
    }

    // Step 3: Retrieve the Kanjis from the repository
    List<KanjiDTO> kanjiList = new ArrayList<>();
    for (Character c : uniqueKanjis) {
      Optional<Kanji> foundKanji = kanjiRepo.findByKanji(String.valueOf(c));

      // Step 4: If the kanji is found in the repository, add it to the result list
      foundKanji.ifPresent(value -> kanjiList.add(toDto(value)));
    }

    return kanjiList;
  }

  // Utility function to check if a character is a valid Kanji
  private boolean isKanji(char c) {
    // Check if the character is within the Kanji Unicode range (for simplicity, we assume this range)
    return (c >= '一' && c <= '龯') || (c >= '㐀' && c <= '䶿'); // Kanji ranges
  }

  public List<KanjiDTO> getJouyou(){
    return kanjiRepo.findByTag("{jouyou}").stream().map(this::toDto).collect(Collectors.toList());
  }
}
