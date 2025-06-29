package com.japangular.quizzingbydoing.backendspeed.kanjidict.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "kanji")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Kanji {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 1)
    private String kanji;

    @Column
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> onyomi;

    @Column
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> kunyomi;

    @Column
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> meanings;

    @Column
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> tags;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;
}

