package com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.config;

public class Constants {
    public static final String CSV_LINE_SEPARATOR = "\u001F";
    public static final int SQLITE_DEFAULT_OFFSET = 0;
    public static final int SQLITE_DEFAULT_LIMIT = 100;
    // There are currently 1500 rows. Other anki db might need additional handling
    public static final int SQLITE_MAX_LIMIT = 1500;
    // The first row of the anki db is used for Information Purposes
    public static final int SQLITE_REQUIRED_OFFSET = 1;
}
