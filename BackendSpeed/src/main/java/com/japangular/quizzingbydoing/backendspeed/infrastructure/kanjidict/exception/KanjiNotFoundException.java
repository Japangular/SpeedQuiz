package com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class KanjiNotFoundException extends RuntimeException {
    public KanjiNotFoundException(String message) {
        super(message);
    }
}
