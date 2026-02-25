package com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.services;

import com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.entity.UserTableState;
import com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.repository.UserTableStateRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AnkiPersistenceService {
  private static final String DEV_DECK_NAME = "dev_ignored_anki_rows";
  private final UserTableStateRepository userTableStateRepository;
  private static final Logger logger = LoggerFactory.getLogger(AnkiPersistenceService.class);

  public void persistIgnoredAnkiRows(String[] ignoredRowsId) {
    // Fetch existing rowids for the given deck
    List<String> existingRowIds = userTableStateRepository
        .findRowidsByDecknameAndRowidIn(DEV_DECK_NAME, Arrays.asList(ignoredRowsId));

    // Filter out existing ones
    Arrays.stream(ignoredRowsId)
        .filter(rowId -> !existingRowIds.contains(rowId))
        .map(rowId -> {
          UserTableState uts = new UserTableState();
          uts.setRowid(rowId);
          uts.setDeckname(DEV_DECK_NAME);
          return uts;
        })
        .forEach(userTableStateRepository::save);
  }

  // Reverse: Retrieve ignored row IDs
  public String[] getIgnoredAnkiRowsId() {
    return userTableStateRepository
        .findAllByDeckname(DEV_DECK_NAME)        // Custom method in repository
        .stream()
        .map(UserTableState::getRowid)
        .toArray(String[]::new);
  }

  @Transactional
  public void deleteIgnoredAnkiRows(String[] rowIdsToDelete) {
    userTableStateRepository.deleteByDecknameAndRowidIn(DEV_DECK_NAME, Arrays.asList(rowIdsToDelete));
  }

  public String getCurrentDeckName(){
    return DEV_DECK_NAME;
  }

  public void overwritePersistIgnoredAnkiRows(String[] ignoredRowIds) {
    String[] alreadyPersistedRows = getIgnoredAnkiRowsId();

    Set<String> incoming = new HashSet<>(Arrays.asList(ignoredRowIds));
    Set<String> persisted = new HashSet<>(Arrays.asList(alreadyPersistedRows));

    // ❌ Do NOT re-save these — they're already in DB
    Set<String> alreadyPresent = new HashSet<>(incoming);
    alreadyPresent.retainAll(persisted);

    // ✅ These are new — need to be saved
    Set<String> toBePersisted = new HashSet<>(incoming);
    toBePersisted.removeAll(persisted);

    // ❌ These are stale — need to be deleted
    Set<String> toBeDeleted = new HashSet<>(persisted);
    toBeDeleted.removeAll(incoming);

    // Save only new entries
    persistIgnoredAnkiRows(toBePersisted.toArray(new String[0]));

    // Delete stale entries
    deleteIgnoredAnkiRows(toBeDeleted.toArray(new String[0]));

    logger.info("new ignored rows"+ Arrays.asList(ignoredRowIds));
    logger.info("already persistence: " + alreadyPresent);
    logger.info("to be persisted: " + toBePersisted);
    logger.info("to be deleted: " + toBeDeleted);

  }

}
