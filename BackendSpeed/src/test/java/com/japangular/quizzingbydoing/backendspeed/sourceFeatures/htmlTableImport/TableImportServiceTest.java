package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.persistence.deck.DeckModel;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport.HtmlTableExtractorTest.TANOS;

import static org.junit.jupiter.api.Assertions.*;

public class TableImportServiceTest {

  @Test
  public void importTable() throws Exception {
    TableImportService tableImportService = new TableImportService(new HtmlTableDeckImporter());
    List<DeckModel> deckModelList = tableImportService.parseAll(Arrays.stream(TANOS).toList(), "TestUser");
    assertEquals(10, deckModelList.size());
  }

}
