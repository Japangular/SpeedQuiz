package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "transcript_row"
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptRow {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "stream_id", nullable = false)
  private TranscriptStream stream;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String transcript;

  @Column(nullable = false)
  private String fromTimestamp;

  @Column(nullable = false)
  private String toTimestamp;
}
