package com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.config;


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

        dataSource.setDriverClassName(Objects.requireNonNull(env.getProperty("spring.datasource.sqlite.driverClassName")));
        dataSource.setUrl(env.getProperty("spring.datasource.sqlite.url"));
        dataSource.setUsername(env.getProperty("spring.datasource.sqlite.username", ""));
        dataSource.setPassword(env.getProperty("spring.datasource.sqlite.password", ""));

        return dataSource;
    }

  @Bean(name = "sqliteJdbcTemplate")
  public JdbcTemplate sqliteJdbcTemplate(@Qualifier("sqliteDataSource") DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }
}
