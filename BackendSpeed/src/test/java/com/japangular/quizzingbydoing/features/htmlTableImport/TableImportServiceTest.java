package com.japangular.quizzingbydoing.features.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.features.htmlTableImport.HtmlTableDeckImporter;
import com.japangular.quizzingbydoing.backendspeed.features.htmlTableImport.TableImportService;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static com.japangular.quizzingbydoing.features.htmlTableImport.HtmlTableExtractorTest.TANOS;

import static org.junit.jupiter.api.Assertions.*;

public class TableImportServiceTest {

  @Test
  public void importTable() throws Exception {
    TableImportService tableImportService = new TableImportService(new HtmlTableDeckImporter());
    List< SubmissionDeck> submissionDeckList = tableImportService.parseAll(Arrays.stream(TANOS).toList(), "TestUser");
    assertEquals(10, submissionDeckList.size());
  }

}
