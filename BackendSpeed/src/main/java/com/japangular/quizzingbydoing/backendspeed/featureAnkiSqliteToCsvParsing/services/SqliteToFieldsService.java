package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.services;


import com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.config.Constants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SqliteToFieldsService {

  private final JdbcTemplate sqliteJdbcTemplate;

  @Autowired
  public SqliteToFieldsService(@Qualifier("sqliteJdbcTemplate") JdbcTemplate sqliteJdbcTemplate) {
    this.sqliteJdbcTemplate = sqliteJdbcTemplate;
  }

  public List<String> toCsv(int limit, int offset) {
    // Use SQLite query
    String sql = "SELECT id, flds FROM notes LIMIT " + limit + " OFFSET " + offset + ";";
    return sqliteJdbcTemplate.queryForList(sql)
        .stream()
        .map(row -> row.get("id") + Constants.CSV_LINE_SEPARATOR + row.get("flds"))
        .collect(Collectors.toList());
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
