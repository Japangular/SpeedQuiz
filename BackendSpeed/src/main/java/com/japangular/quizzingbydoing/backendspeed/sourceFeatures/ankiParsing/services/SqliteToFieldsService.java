package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.services;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.config.Constants;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SqliteToFieldsService {
  @Qualifier("sqliteJdbcTemplate")
  private final JdbcTemplate sqliteJdbcTemplate;

  public List<String> toCsv(int limit, int offset) {
    String sql = "SELECT id, flds FROM notes LIMIT ? OFFSET ?";
    return sqliteJdbcTemplate.queryForList(sql, limit, offset).stream()
        .map(row -> row.get("id") + Constants.CSV_LINE_SEPARATOR + row.get("flds")).collect(Collectors.toList());
  }

  public int total() {
    String sql = "SELECT count(*) FROM notes;";
    Integer result = sqliteJdbcTemplate.queryForObject(sql, Integer.class);
    return result != null ? result : 0;
  }

  public List<String> loadAll() {
    String sql = "SELECT id, flds FROM notes;";
    return sqliteJdbcTemplate.queryForList(sql)
        .stream()
        .map(row -> row.get("id") + Constants.CSV_LINE_SEPARATOR + row.get("flds"))
        .collect(Collectors.toList());
  }
}
