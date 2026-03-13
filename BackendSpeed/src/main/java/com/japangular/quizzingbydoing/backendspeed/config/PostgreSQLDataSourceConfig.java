package com.japangular.quizzingbydoing.backendspeed.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
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
        "com.japangular.quizzingbydoing.backendspeed.persistence",
        "com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.repository",
        "com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.repository",
        "com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.repositories",
    },
    entityManagerFactoryRef = "postgresqlEntityManagerFactory",
    transactionManagerRef = "postgresqlTransactionManager"
)
public class PostgreSQLDataSourceConfig {

    @Value("${spring.datasource.postgresql.url}")
    private String url;

    @Value("${spring.datasource.postgresql.username}")
    private String username;

    @Value("${spring.datasource.postgresql.password}")
    private String password;

    @Primary
    @Bean(name = "postgresqlDataSource")
    public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }

    @Primary
    @Bean(name = "postgresqlTransactionManager")
    public PlatformTransactionManager transactionManager(@Qualifier("postgresqlEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Primary
    @Bean(name = "postgresqlEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean postgresqlEntityManagerFactory(EntityManagerFactoryBuilder builder, @Qualifier("postgresqlDataSource") DataSource dataSource) {
        return builder
            .dataSource(dataSource)
            .packages(
                "com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.entity",
                "com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.entity",
                "com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.entities"
            ) // Package where your PostgreSQL entities are located
            .persistenceUnit("postgresql")
            .properties(hibernateProperties())
            .build();
    }

    public Map<String, Object> hibernateProperties() {
        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "validate");
        return properties;
    }

    @Bean(name = "postgresqlJdbcTemplate")
    public JdbcTemplate postgresqlJdbcTemplate(@Qualifier("postgresqlDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

}
