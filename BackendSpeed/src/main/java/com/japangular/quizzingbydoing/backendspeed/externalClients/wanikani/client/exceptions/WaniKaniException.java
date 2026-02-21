package com.japangular.quizzingbydoing.backendspeed.externalClients.wanikani.client.exceptions;


import lombok.Data;

@Data
public class WaniKaniException extends RuntimeException {
  //Example: a wrong token would return {"error":"Unauthorized. Nice try.","code":401}
  private final int statusCode;

  public WaniKaniException(int statusCode, String message) {
    super(message);
    this.statusCode = statusCode;
  }

}

