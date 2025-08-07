package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.config;


import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.util.Objects;

@Configuration
public class JpaSqliteConfig {
    private final Environment env;

  public JpaSqliteConfig(Environment env) {
    this.env = env;
  }


  @Bean(name = "sqliteDataSource")
  @Qualifier("sqliteDataSource")
  public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();

        // Fetching the properties from the application.properties using env.getProperty
        dataSource.setDriverClassName(Objects.requireNonNull(env.getProperty("spring.datasource.sqlite.driverClassName")));
        dataSource.setUrl(env.getProperty("spring.datasource.sqlite.url"));
        dataSource.setUsername(env.getProperty("spring.datasource.sqlite.username", ""));  // SQLite doesn't need a username
        dataSource.setPassword(env.getProperty("spring.datasource.sqlite.password", ""));  // SQLite doesn't need a password

        return dataSource;
    }

  @Bean(name = "sqliteJdbcTemplate")
  public JdbcTemplate sqliteJdbcTemplate(@Qualifier("sqliteDataSource") DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }
}
