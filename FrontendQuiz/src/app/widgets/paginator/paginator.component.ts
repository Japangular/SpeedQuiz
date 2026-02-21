import {Component, Input} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {MatChip} from '@angular/material/chips';
import {NgIf} from '@angular/common';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {AnkiTableService} from '../../features/anki-table/anki-table.service';

@Component({
  selector: 'app-paginator',
  imports: [
  ],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.css'
})
export class PaginatorComponent {

}
