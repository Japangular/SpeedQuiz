package com.japangular.quizzingbydoing.backendspeed.kanjidict.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.entity.Kanji;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.exception.KanjiNotFoundException;
import com.japangular.quizzingbydoing.backendspeed.kanjidict.repository.KanjiRepository;
import com.japangular.quizzingbydoing.backendspeed.quizFrontend.controller.SubmissionDeckController;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class KanjiImportService {

    private final KanjiRepository kanjiRepo;
    private static final Logger logger = LoggerFactory.getLogger(KanjiImportService.class);

    public void importJson() throws IOException {
        logger.info("Starting to import the KanjiDic");

        if (kanjiRepo.count() > 0) {
            logger.info("KanjiDic already imported. Has " + kanjiRepo.count() + " entries");
            return;
        }
        //kanjiRepo.deleteAll();

        ObjectMapper mapper = new ObjectMapper();

        for (String path : new String[]{"KANJIDIC_english/kanji_bank_1.json", "KANJIDIC_english/kanji_bank_2.json"}) {
            try (var in = getClass().getClassLoader().getResourceAsStream(path)) {
                if (in == null) {
                    throw new IOException("Resource not found: " + path);
                }
                importFromJson(mapper, in);
            }
        }
        logger.info("Finished import the KanjiDic");
        logger.info("Fire is " + getByKanji("火").toString());
    }

    public void importFromJson(ObjectMapper mapper, InputStream jsonStream) throws IOException {
        JsonNode root = mapper.readTree(jsonStream);

        for (JsonNode node : root) {
            String character = node.get(0).asText();
            String onyomiRaw = node.get(1).asText();
            String kunyomiRaw = node.get(2).asText();
            String tag = node.get(3).asText();
            List<String> meanings = new ArrayList<>();
            for (JsonNode m : node.get(4)) meanings.add(m.asText());

            Kanji k = new Kanji();
            k.setKanji(character);
            k.setOnyomi(Arrays.asList(onyomiRaw.split(" ")));
            k.setKunyomi(Arrays.asList(kunyomiRaw.split(" ")));
            k.setMeanings(meanings);

            List<String> tags = new ArrayList<>();
            if (!tag.isEmpty()) tags.add(tag);
            k.setTags(tags);

            Map<String, Object> metadata = mapper.convertValue(node.get(5), new TypeReference<>() {
            });
            k.setMetadata(metadata);

            kanjiRepo.save(k);
        }
    }

    public Kanji getByKanji(String kanji) {
        return kanjiRepo.findByKanji(kanji).orElseThrow(() -> new KanjiNotFoundException("Kanji not found: " + kanji));
    }

}
