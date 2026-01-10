import { HttpClient } from '@angular/common/http';
import { environment } from '../environment/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly API_URL = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) {}

  createRoom(): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/create`, {});
  }
  
  verifyRoom(code: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${code}`);
  }

  closeRoom(code: string): Observable<any> {
  // Sending a patch request to update status to 'closed'
    return this.http.patch<any>(`${this.API_URL}/${code}/close`, {});
  }

}