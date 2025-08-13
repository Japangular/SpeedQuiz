package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
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
        "com.japangular.quizzingbydoing.backendspeed.quizFrontend.repository",
        "com.japangular.quizzingbydoing.backendspeed.kanjidict.repository"
    },
    entityManagerFactoryRef = "postgresqlEntityManagerFactory",
    transactionManagerRef = "postgresqlTransactionManager"
)
public class PostgreSQLDataSourceConfig {

    @Primary
    @Bean(name = "postgresqlDataSource")
    public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setUrl("jdbc:postgresql://db:5432/speedquizdb");
        dataSource.setUsername("speedquiz");
        dataSource.setPassword("X9@1b6Y2p3Z4w3k5P5L6m1");
        return dataSource;
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
        @Qualifier("postgresqlDataSource") DataSource dataSource
    ) {
        return builder
            .dataSource(dataSource)
            .packages("com.japangular.quizzingbydoing.backendspeed.kanjidict.entity") // Package where your PostgreSQL entities are located
            .persistenceUnit("postgresql")
            .properties(hibernateProperties())
            .build();
    }

    public Map<String, Object> hibernateProperties() {
        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        return properties;
    }

    @Bean(name = "postgresqlJdbcTemplate")
    public JdbcTemplate postgresqlJdbcTemplate(@Qualifier("postgresqlDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

}
