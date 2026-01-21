import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environment/environment';

export interface Loadout {
  id: string;
  name: string;
  gridSize: number;
  arrangement: number[];
}

@Injectable({ providedIn: 'root' })
export class LoadoutService {
  private baseUrl = `${environment.apiUrl}`;
  private loadoutsSubject = new BehaviorSubject<Loadout[]>([]);
  loadouts$ = this.loadoutsSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchLoadouts(): Observable<Loadout[]> {
    this.loadoutsSubject.next([]);
    return this.http.get<Loadout[]>(`${this.baseUrl}/profile/loadout`, { withCredentials: true }).pipe(
      tap(data => this.loadoutsSubject.next(data))
    );
  }
}