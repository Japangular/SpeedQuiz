package com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e;

import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.model.Entry;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.model.EntryDto;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Maps the internal JAXB {@link Entry} domain model to the API-facing {@link EntryDto}.
 * <p>
 * Defensive throughout: every nullable list from the XML model is guarded with
 * {@code Optional.ofNullable(...).orElse(List.of())} so a partially-parsed entry
 * (e.g. a kana-only word with no kanji element) never causes a NullPointerException.
 */
public final class EntryMapper {

  private EntryMapper() {
    // utility class — not instantiable
  }

  public static EntryDto toDto(Entry entry) {
    EntryDto dto = new EntryDto();
    dto.setEntSeq(entry.getEntSeq());

    // ── Kanji writings (k_ele → keb) ───────────────────────
    dto.setKanji(
        nullSafe(entry.getKEle()).stream()
            .map(Entry.KElement::getKeb)
            .filter(Objects::nonNull)
            .toList()
    );

    // ── Kana readings (r_ele → reb) ────────────────────────
    dto.setReadings(
        nullSafe(entry.getREle()).stream()
            .map(Entry.RElement::getReb)
            .filter(Objects::nonNull)
            .toList()
    );

    // ── Senses (sense → gloss, pos, xref, ant, misc) ──────
    dto.setSenses(
        nullSafe(entry.getSense()).stream()
            .map(EntryMapper::mapSense)
            .toList()
    );

    return dto;
  }

  private static EntryDto.SenseDto mapSense(Entry.Sense sense) {
    EntryDto.SenseDto dto = new EntryDto.SenseDto();
    dto.setGlosses(nullSafe(sense.getGloss()));
    dto.setPartsOfSpeech(nullSafe(sense.getPos()));
    dto.setCrossReferences(nullSafe(sense.getXref()));
    dto.setAntonyms(nullSafe(sense.getAnt()));
    dto.setMisc(nullSafe(sense.getMisc()));
    return dto;
  }

  /**
   * Returns the list itself if non-null, or an empty immutable list otherwise.
   * Avoids littering the mapping code with null checks.
   */
  private static <T> List<T> nullSafe(List<T> list) {
    return list != null ? list : List.of();
  }
}
