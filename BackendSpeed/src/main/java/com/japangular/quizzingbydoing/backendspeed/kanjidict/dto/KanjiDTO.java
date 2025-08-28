package com.japangular.quizzingbydoing.backendspeed.kanjidict.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KanjiDTO {
    private String kanji;
    private List<String> onyomi;
    private List<String> kunyomi;
    private List<String> meanings;
}
