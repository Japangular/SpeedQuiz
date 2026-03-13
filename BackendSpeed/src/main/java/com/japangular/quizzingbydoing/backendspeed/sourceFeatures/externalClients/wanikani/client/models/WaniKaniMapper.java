package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client.models;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class WaniKaniMapper {
  ObjectMapper mapper = new ObjectMapper();

  public WaniKaniUserResponse mapUserResponse(String waniKaniResponse) throws JsonProcessingException {
    return mapper.readValue(waniKaniResponse, WaniKaniUserResponse.class);
  }

  public WaniKaniAssignmentsResponse mapAssignmentsResponse(String waniKaniResponse) throws JsonProcessingException {
    return mapper.readValue(waniKaniResponse, WaniKaniAssignmentsResponse.class);
  }

  public WaniKaniSubjectsResponse mapSubjectsResponse(String json)
      throws JsonProcessingException {
    return mapper.readValue(json, WaniKaniSubjectsResponse.class);
  }
}
