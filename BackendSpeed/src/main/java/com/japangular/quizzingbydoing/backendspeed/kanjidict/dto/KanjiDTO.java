package com.japangular.quizzingbydoing.backendspeed.kanjidict.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;
import java.util.List;

@Data
@AllArgsConstructor
public class KanjiDTO {
    private Long id;
    private String kanji;
    private List<String> onyomi;
    private List<String> kunyomi;
    private List<String> meanings;
    private List<String> tags;
    private Map<String, Object> metadata;
}
