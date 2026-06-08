package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.persistence.session.AppSession;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.SessionRepository;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.SessionService;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.services.AnkiImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

@RestController
@RequestMapping("/anki")
@RequiredArgsConstructor
public class AnkiUploadController {

  private static final UUID DEV_OWNER = UUID.fromString("00000000-0000-0000-0000-000000000001");
  private static final long MAX_SIZE = 100L * 1024 * 1024; // 100MB, tune to taste

  private final AnkiImportService importService;
  private final SessionService sessionService;

  @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Void> importDeck(
      @RequestHeader(value = "X-Session-Token", required = false) String tokenHeader,
      @RequestParam("deckName") String deckName,
      @RequestPart("file") MultipartFile file) throws IOException {

    if (file.isEmpty() || file.getSize() > MAX_SIZE) {
      return ResponseEntity.badRequest().build();
    }
    UUID ownerId = sessionService.requireOwner(tokenHeader);
    Path tmp = Files.createTempFile("anki-", ".db");
    try {
      file.transferTo(tmp);
      Path sqlite = extractIfApkg(tmp); // returns tmp itself if it's already .db
      importService.importAnkiDb(sqlite, deckName, ownerId);
      return ResponseEntity.status(HttpStatus.CREATED).build();
    } finally {
      Files.deleteIfExists(tmp);
    }
  }

  private Path extractIfApkg(Path file) throws IOException {
    // sniff for ZIP magic 'PK\x03\x04'
    byte[] head = new byte[4];
    try (InputStream in = Files.newInputStream(file)) { in.read(head); }
    if (!(head[0] == 'P' && head[1] == 'K')) return file;

    try (ZipFile zip = new ZipFile(file.toFile())) {
      ZipEntry entry = Optional.ofNullable(zip.getEntry("collection.anki21"))
          .orElse(zip.getEntry("collection.anki2"));
      if (entry == null) throw new IllegalArgumentException("No collection.anki21/.anki2 inside .apkg");
      Path out = Files.createTempFile("anki-extracted-", ".db");
      try (InputStream in = zip.getInputStream(entry)) {
        Files.copy(in, out, StandardCopyOption.REPLACE_EXISTING);
      }
      return out;
    }
  }
}