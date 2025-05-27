import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import {Observable, merge, BehaviorSubject} from 'rxjs';

export interface DeckItem {
  [key: string]: string;
}

export class DeckDataSource extends DataSource<DeckItem> {
  private dataSubject = new BehaviorSubject<DeckItem[]>([]);
  paginator: MatPaginator | undefined;
  sort: MatSort | undefined;

  constructor() {
    super();
  }

  get data(): DeckItem[] {
    return this.dataSubject.value;
  }

  set data(newData: DeckItem[]) {
    this.dataSubject.next(newData);
  }

  connect(): Observable<DeckItem[]> {
    if (!this.paginator || !this.sort) {
      throw Error('Please set the paginator and sort on the data source before connecting.');
    }

    return merge(this.dataSubject, this.paginator.page, this.sort.sortChange).pipe(
      map(() => {
        const sortedData = this.getSortedData([...this.dataSubject.value]);
        return this.getPagedData(sortedData);
      })
    );
  }

  disconnect(): void {
    this.dataSubject.complete();
  }

  private getPagedData(data: DeckItem[]): DeckItem[] {
    if (!this.paginator) {
      return data;
    }
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.slice(startIndex, startIndex + this.paginator.pageSize);
  }

  private getSortedData(data: DeckItem[]): DeckItem[] {
    if (!this.sort || !this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const key = this.sort!.active;
      const aVal = a[key] ?? '';
      const bVal = b[key] ?? '';
      const isAsc = this.sort!.direction === 'asc';
      return compare(aVal, bVal, isAsc);
    });
  }
}

function compare(a: string | number, b: string | number, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

