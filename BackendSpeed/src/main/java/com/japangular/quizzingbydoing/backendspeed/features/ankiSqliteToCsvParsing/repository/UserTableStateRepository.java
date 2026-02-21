package com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.repository;

import com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.entity.UserTableState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface UserTableStateRepository extends JpaRepository<UserTableState, Long> {
  List<UserTableState> findAllByDeckname(String deckname);

  @Query("SELECT u.rowid FROM UserTableState u WHERE u.deckname = :deckname AND u.rowid IN :rowids")
  List<String> findRowidsByDecknameAndRowidIn(@Param("deckname") String deckname, @Param("rowids") List<String> rowids);

  @Modifying
  @Transactional
  void deleteByDecknameAndRowidIn(String deckname, List<String> rowids);


}
