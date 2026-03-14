package com.japangular.quizzingbydoing.backendspeed.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = {
        "com.japangular.quizzingbydoing.backendspeed.persistence",
        "com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.repository",
        "com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.repository",
        "com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.repositories",
    },
    entityManagerFactoryRef = "postgresqlEntityManagerFactory",
    transactionManagerRef = "postgresqlTransactionManager"
)
public class PostgreSQLDataSourceConfig {

  @Primary
  @Bean
  @ConfigurationProperties("spring.datasource.postgresql")
  public DataSourceProperties postgresqlDataSourceProperties() {
    return new DataSourceProperties();
  }

  @Primary
  @Bean(name = "postgresqlDataSource")
  public DataSource postgresqlDataSource() {
    return postgresqlDataSourceProperties()
        .initializeDataSourceBuilder()
        .build();
  }

  @Primary
  @Bean(name = "postgresqlTransactionManager")
  public PlatformTransactionManager transactionManager(
      @Qualifier("postgresqlEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new JpaTransactionManager(entityManagerFactory);
  }

  @Primary
  @Bean(name = "postgresqlEntityManagerFactory")
  public LocalContainerEntityManagerFactoryBean postgresqlEntityManagerFactory(
      EntityManagerFactoryBuilder builder,
      @Qualifier("postgresqlDataSource") DataSource dataSource) {
    return builder
        .dataSource(dataSource)
        .packages(
            "com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.entity",
            "com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.entity",
            "com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.entities"
        )
        .persistenceUnit("postgresql")
        .properties(hibernateProperties())
        .build();
  }

  private Map<String, Object> hibernateProperties() {
    Map<String, Object> properties = new HashMap<>();
    properties.put("hibernate.hbm2ddl.auto", "none");
    return properties;
  }

  @Primary
  @Bean(name = "postgresqlJdbcTemplate")
  public JdbcTemplate postgresqlJdbcTemplate(
      @Qualifier("postgresqlDataSource") DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }
}