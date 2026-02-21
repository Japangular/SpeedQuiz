package com.japangular.quizzingbydoing.backendspeed.features.kanjidict.repository;

import com.japangular.quizzingbydoing.backendspeed.features.kanjidict.entity.Kanji;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

import java.util.List;

public interface KanjiRepository extends JpaRepository<Kanji, Long> {
    Optional<Kanji> findByKanji(String kanji);

    @Query(value = "SELECT * FROM kanji k WHERE cast(:tag as text) = ANY(k.tags)", nativeQuery = true)
    List<Kanji> findByTag(String tag);
}
