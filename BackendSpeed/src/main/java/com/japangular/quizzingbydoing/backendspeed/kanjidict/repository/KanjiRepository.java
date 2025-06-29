package com.japangular.quizzingbydoing.backendspeed.kanjidict.repository;

import com.japangular.quizzingbydoing.backendspeed.kanjidict.entity.Kanji;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KanjiRepository extends JpaRepository<Kanji, Long> {
    Optional<Kanji> findByKanji(String kanji);
}
