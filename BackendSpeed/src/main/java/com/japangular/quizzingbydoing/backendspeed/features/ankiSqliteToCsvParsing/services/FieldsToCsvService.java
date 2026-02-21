package com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.services;


import com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.config.Constants;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FieldsToCsvService {
  private final SqliteToFieldsService sqliteToFieldsService;

  private boolean firstRowWasFaulty = false;
  private int numberOfFields = 0;
  private int currentStart = 0;
  private int current = 0;

  private int total = -1;

  public FieldsToCsvService(SqliteToFieldsService sqliteToFieldsService) {
    this.sqliteToFieldsService = sqliteToFieldsService;
  }

  public List<String[]> getCsv() {
    return getCsv(100, 0);
  }

  public List<String[]> getCsv(int limit, int offset) {
    List<String> rows = sqliteToFieldsService.toCsv(limit, offset);
    List<String[]> csv = rows.stream().map(fields -> fields.split(Constants.CSV_LINE_SEPARATOR)).filter(this::validateCsv).toList();
    if (firstRowWasFaulty) {
      csv = csv.subList(currentStart, csv.size());
    }
    return csv;
  }

  public List<String[]> loadAll() {
    List<String> rows = sqliteToFieldsService.loadAll();
    List<String[]> csv = rows.stream().map(fields -> fields.split(Constants.CSV_LINE_SEPARATOR)).filter(this::validateCsv).toList();
    if (firstRowWasFaulty) {
      csv = csv.subList(currentStart, csv.size());
    }
    return csv;
  }

  private boolean validateCsv(String[] csv) {
    if (csv.length > numberOfFields) {
      numberOfFields = csv.length;
      if (current > 0) {
        currentStart = current;
        firstRowWasFaulty = true;
      }
    }
    boolean result = true;

    if (csv.length == numberOfFields) {
      for (int i = 0; i < 4; i++) {
        if (csv[i] == null || csv[i].isEmpty()) {
          return false;
        }
      }
    }
    current++;
    return result;
  }

  public int totalQuestions() {
    if(total==-1){
      total = sqliteToFieldsService.total();
    }
    return total;
  }
}
