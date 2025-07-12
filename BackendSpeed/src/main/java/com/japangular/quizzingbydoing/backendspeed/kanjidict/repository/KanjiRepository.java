package com.japangular.quizzingbydoing.backendspeed.kanjidict.repository;

import com.japangular.quizzingbydoing.backendspeed.kanjidict.entity.Kanji;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

import java.util.List;

public interface KanjiRepository extends JpaRepository<Kanji, Long> {
    Optional<Kanji> findByKanji(String kanji);

    @Query(value = "SELECT * FROM kanji k WHERE :tag = ANY(k.tags)", nativeQuery = true)
    List<Kanji> findByTag(String tag);
}
