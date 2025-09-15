package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "user_table_state",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"rowid", "deckname"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserTableState {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String rowid;

  private String deckname;
}
