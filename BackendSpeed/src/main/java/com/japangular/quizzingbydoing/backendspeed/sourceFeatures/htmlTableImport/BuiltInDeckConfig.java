package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport.model.DeckEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.IOException;
import java.util.Objects;

@Configuration
@RequiredArgsConstructor
public class BuiltInDeckConfig {

  @Value("${app.deck-import.path}")
  private String basePath;

  private final ObjectMapper objectMapper;
  private final HtmlTableDeckImporter importer;

  @Bean
  SmartInitializingSingleton registerBuiltInDecks(ConfigurableListableBeanFactory factory) {
    return () -> {
      try {
        File root = new File(basePath);
        if (!root.isDirectory()) return;

        for (File dir : Objects.requireNonNull(root.listFiles(File::isDirectory))) {
          File config = new File(dir, "deck-config.json");
          if (!config.exists()) continue;

          DeckPackageConfig pkg = objectMapper.readValue(config, DeckPackageConfig.class);

          for (DeckEntry entry : pkg.getDecks()) {
            String fullPath = dir.getAbsolutePath() + "/" + entry.getFile();
            factory.registerSingleton(
                "builtInDeck_" + entry.getId(),
                new HtmlResourceDeckProvider(entry, pkg.getAttribution(), fullPath, importer));
          }
        }
      } catch (IOException e) {
        throw new RuntimeException(
            "Failed to load deck configs", e);
      }
    };
  }
}
