package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DefaultPropertyMapper {

  public Map<String, PropertyType> map(List<String> header) {

    Map<String, PropertyType> properties = new LinkedHashMap<>();

    for (int i = 0; i < header.size(); i++) {

      String column = header.get(i);

      if (i == 0) {
        properties.put(column, PropertyType.QUESTION);
      } else {
        properties.put(column, PropertyType.ANSWER);
      }
    }

    return properties;
  }
}
