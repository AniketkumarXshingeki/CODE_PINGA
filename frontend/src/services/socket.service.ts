import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = environment.socketUrl;
  // Subjects to hold real-time data
  private participantsSubject = new BehaviorSubject<any[]>([]);
  public participants$ = this.participantsSubject.asObservable();
  private gameTypeSubject = new BehaviorSubject<string | null>(null);
  public gameType$ = this.gameTypeSubject.asObservable();
  private matchStartedSubject = new BehaviorSubject<boolean>(false);
  public matchStarted$ = this.matchStartedSubject.asObservable();
  private roomDestroyedSubject = new BehaviorSubject<string | null>(null);
  public roomDestroyed$ = this.roomDestroyedSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  connect() {
    if (isPlatformBrowser(this.platformId) && !this.socket) {
      this.socket = io(this.SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true, // Or false if you want to call .connect() manually
      });
      this.setupListeners();
    }
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    // Listen for the updated participant list from the Gateway
    this.socket.on('updateParticipants', (participants: any[]) => {
      console.log('Real-time participants updated:', participants);
      this.participantsSubject.next(participants);
    });

    // Listen for the signal that the match has started
    this.socket.on('matchStarted', () => {
      this.matchStartedSubject.next(true);
    });

    this.socket.on('gameTypeUpdated', (type: string) => {
      console.log('Game type updated from server:', type);
      this.gameTypeSubject.next(type);
    });
    // Handle reconnections
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket Gateway');
    });

    this.socket.on('roomDestroyed', (message: string) => {
      this.roomDestroyedSubject.next(message);
    });

    this.socket.on('gameTypeLocked', (type: string) => {
      this.gameTypeSubject.next(type);
    });
  }
  setGameType(roomCode: string, gameType: string) {
    if (this.socket) {
      this.socket.emit('setGameType', { roomCode, gameType });
    }
  }
  /**
   * Send a message to the server to join a specific room
   */
  joinRoom(roomCode: string, userId: string, username: string) {
    if (this.socket) {
      this.socket.emit('joinRoom', { roomCode, userId, username });
    }
  }

  /**
   * Host triggers this to tell everyone to start the game
   */
  startGame(roomCode: string) {
    if (this.socket) {
      this.socket.emit('startGame', roomCode);
    }
  }
  toggleReady(roomCode: string, userId: string) {
    if (this.socket) {
      this.socket.emit('toggleReady', { roomCode, userId });
    }
  }
  /**
   * Clean up connection on logout
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
  resetRoomState() {
    this.gameTypeSubject.next(null);
    this.participantsSubject.next([]);
    this.roomDestroyedSubject.next(null);
    this.matchStartedSubject.next(false);
  }
  leaveRoom(roomCode: string) {
    this.socket?.emit('leaveRoom', { roomCode });
    this.resetRoomState(); // Clear the data locally
    this.disconnect(); // Close connection
  }
}
