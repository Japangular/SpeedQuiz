package com.japangular.quizzingbydoing.backendspeed.repository;

import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubmissionDeckRepository  extends JpaRepository<SubmissionDeck, Long> {
}
