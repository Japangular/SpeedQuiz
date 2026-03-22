import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatTable, MatTableModule} from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {DeckDataSource} from './deck-datasource';
import {MatButton} from '@angular/material/button';
import {DeckChooserComponent} from '../deck-chooser/deck-chooser.component';
import {NgForOf} from '@angular/common';
import {CardStoreService} from '../../../services/card-store.service';
import {DeckItem} from './deck-table.model';

@Component({
  selector: 'app-deck',
  templateUrl: './deck.component.html',
  styleUrl: './deck.component.css',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatButton, DeckChooserComponent, NgForOf]
})
export class DeckComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<DeckItem>;
  dataSource = new DeckDataSource();

  displayedColumns = ['id', 'name'];

  constructor(private cardStore: CardStoreService) {
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    setTimeout(() => {
      this.dataSource.data = EXAMPLE_DATA;
    });
    this.table.dataSource = this.dataSource;
  }

  sendTableData(): void {
    const tableData = this.dataSource.data;
    console.log('Sending data:', tableData);
    this.cardStore.setCurrentDeck(tableData);
    this.cardStore.sendCurrentDeck();
  }

  switchDeck(deckName: string) {
    this.cardStore.switchDeck(deckName).subscribe(deck => {
      setTimeout(() => {
        this.displayedColumns = deck.displayedColumns;
        this.dataSource.data = deck.deckItems;
        this.table.renderRows();
      });
    });
  }
}

const EXAMPLE_DATA: DeckItem[] = [
  {id: "1", name: 'Hydrogen'},
  {id: "2", name: 'Helium'},
  {id: "3", name: 'Lithium'},
  {id: "4", name: 'Beryllium'},
  {id: "5", name: 'Boron'},
  {id: "6", name: 'Carbon'},
  {id: "7", name: 'Nitrogen'},
  {id: "8", name: 'Oxygen'},
  {id: "9", name: 'Fluorine'},
  {id: "10", name: 'Neon'},
  {id: "11", name: 'Sodium'},
  {id: "12", name: 'Magnesium'},
  {id: "13", name: 'Aluminum'},
  {id: "14", name: 'Silicon'},
  {id: "15", name: 'Phosphorus'},
  {id: "16", name: 'Sulfur'},
  {id: "17", name: 'Chlorine'},
  {id: "18", name: 'Argon'},
  {id: "19", name: 'Potassium'},
  {id: "20", name: 'Calcium'},
];
