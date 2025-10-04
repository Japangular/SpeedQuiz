package com.japangular.quizzingbydoing.backendspeed.transcriptCards.entities;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "transcript_stream",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"streamTitle", "vtuber"})
    },
    indexes = {
        @Index(
            name = "transcript_stream_filename_vtuber_unique",
            columnList = "filename, vtuber"
        )
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptStream {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String filename;

  private String streamTitle;

  @Column(nullable = false)
  private String vtuber;

}
