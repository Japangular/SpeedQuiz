package com.japangular.quizzingbydoing.backendspeed.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.List;

public class JsonBatchImporter {

  private static final int DEFAULT_BATCH_SIZE = 100;

  public static <T> void importJson(
      InputStream jsonStream,
      Function<JsonNode, T> mapper,
      Consumer<List<T>> consumer,
      int batchSize
  ) throws IOException {

    ObjectMapper objectMapper = new ObjectMapper();
    JsonNode root = objectMapper.readTree(jsonStream);

    List<T> batch = new ArrayList<>();
    int count = 0;

    for (JsonNode node : root) {
      T mapped = mapper.apply(node);
      batch.add(mapped);
      count++;

      if (count % batchSize == 0) {
        consumer.accept(batch);
        batch.clear();
      }
    }

    if (!batch.isEmpty()) {
      consumer.accept(batch);
    }
  }

  // optional convenience overload
  public static <T> void importJson(
      InputStream jsonStream,
      Function<JsonNode, T> mapper,
      Consumer<List<T>> batchConsumer
  ) throws IOException {
    importJson(jsonStream, mapper, batchConsumer, DEFAULT_BATCH_SIZE);
  }
}
