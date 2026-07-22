package com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.repository;

import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.entity.Kanji;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.NativeQuery;

import java.util.Optional;

import java.util.List;

public interface KanjiRepository extends JpaRepository<Kanji, Long> {
  Optional<Kanji> findByKanji(String kanji);

  @NativeQuery("SELECT * FROM kanji k WHERE cast(:tag as text) = ANY(k.tags)")
  List<Kanji> findByTag(String tag);
}
