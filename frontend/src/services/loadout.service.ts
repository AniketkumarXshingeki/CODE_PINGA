import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Loadout {
  id: string;
  name: string;
  gridSize: number;
  arrangement: number[];
}

@Injectable({ providedIn: 'root' })
export class LoadoutService {
  private loadoutsSubject = new BehaviorSubject<Loadout[]>([]);
  loadouts$ = this.loadoutsSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchLoadouts(): Observable<Loadout[]> {
    return this.http.get<Loadout[]>('http://localhost:3000/profile').pipe(
      tap(data => this.loadoutsSubject.next(data))
    );
  }
}