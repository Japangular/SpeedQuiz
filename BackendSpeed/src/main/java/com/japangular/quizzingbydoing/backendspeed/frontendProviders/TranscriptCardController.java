package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.apiModels.ApiStreamTranscript;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.services.TranscriptCardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transcriptCards")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
public class TranscriptCardController {

  private final TranscriptCardService transcriptCardService;
  private static final Logger logger = LoggerFactory.getLogger(TranscriptCardController.class);

  public TranscriptCardController(TranscriptCardService transcriptCardService) {
    this.transcriptCardService = transcriptCardService;
  }

  @PostMapping("/persistStreamTranscripts")
  public ResponseEntity<Boolean> persistStreamTranscripts(@RequestBody ApiStreamTranscript request) {
    logger.info("persistStreamTranscripts called");
    Boolean returnValue = transcriptCardService.processUpload(request);
    return ResponseEntity.ok(returnValue);
  }

  @GetMapping("/checkByTitleAndVTuber")
  public ResponseEntity<Boolean> checkByTitleAndVTuber(@RequestParam String title, @RequestParam String vtuber) {
    Boolean returnValue = transcriptCardService.check(title, vtuber);
    logger.info("Stream {} of {} {}", title, vtuber, returnValue ? "exists" : "does not exist");
    return ResponseEntity.ok(returnValue);
  }
}
