import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadoutService } from '../../services/loadout.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChevronDown,
  Eye,
  Info,
  LayoutGrid,
  LucideAngularModule,
  Monitor,
  Play,
  Users,
} from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-room',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './room.html',
  styleUrl: './room.css',
})
export class Room implements OnInit {
  roomId: string | null = null;
  isHost: boolean = false;
  participants: any[] = []; // List of players in room
  availableLoadouts: any[] = [];
  selectedLoadoutId: string = '';
  roomHostId: string = '';
  currentGameType: string | null = null;
  gameTypes = ['5x5', '6x6', '7x7', '8x8', '9x9', '10x10'];
  pendingGameType: string | null = null;
  isStarting: boolean = false;
  readonly icons = { ChevronDown, LayoutGrid, Play, Users, Monitor, Info, Eye };
  // View States
  view: 'selection' | 'lobby' = 'selection';
  joinRoomId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loadoutService: LoadoutService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private authService: AuthService,
    private socketService: SocketService,
    private roomService: RoomService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Listen for changes in the URL (e.g., switching from /room to /room/ABCD)
      this.route.params.subscribe((params) => {
        const idFromUrl = params['id'];

        if (idFromUrl) {
          this.roomId = idFromUrl.toUpperCase();
          this.view = 'lobby';
          this.connectToRoomLogic(idFromUrl);
        } else {
          this.roomId = null;
          this.view = 'selection';
        }
      });

      // 2. Load the player's saved bingo grids
      this.loadoutService.loadouts$.subscribe(
        (data) => (this.availableLoadouts = data)
      );
      this.loadoutService.fetchLoadouts().subscribe();

      // 3. Listen for live participant updates from the Socket
      this.socketService.participants$.subscribe((list) => {
        this.participants = list;
      });

      this.socketService.gameType$.subscribe((type) => {
        this.currentGameType = type;
      });

      this.socketService.startCountdown$.subscribe(() => {
        this.isStarting = true;
        this.autoSubmitLoadout();
      });

      this.socketService.matchStarted$.subscribe((data) => {
        this.isStarting = false;
        // Navigate to the game route and pass the data via state
        if( this.roomId ){
        this.router.navigate(['/board', this.roomId], { 
        state: { matchData: {
          ...data,
          myLoadout: this.selectedLoadout.arrangement
        } } 
        });
      }
      });

      this.socketService.roomDestroyed$.subscribe((message) => {
        if (message) {
          alert(message);
          this.router.navigate(['/room']);
        }
      });
    }
  }
  // Handle the Room Entry (Both Host and Guest)
  private connectToRoomLogic(code: string) {
    // First, verify the room exists in the Database via REST
    this.roomService.verifyRoom(code).subscribe({
      next: (roomData) => {
        const username = this.authService.username;
        const userId = this.authService.userId; // Ensure this method exists in your AuthService
        this.roomHostId = roomData.hostId;
        // Identify if current user is the host
        this.isHost = roomData.hostId === userId;

        // Second, connect to the WebSocket for live updates
        const socket=this.socketService.connect();
        // This prevents sending joinRoom to a disconnected socket
        if (socket) {
          if (socket.connected) {
            this.socketService.joinRoom(code, userId, username);
          }else{
          socket.on('connect', () => {
            this.socketService.joinRoom(code, userId, username);
        });
      }

        // If already connected, join immediately
      }
    },
      error: (err) => {
        console.error('Room verification failed:', err);
        this.socketService.resetRoomState(); // Ensure clean state on failure
        alert('Room not found or inactive.');
        this.router.navigate(['/room']);
      },
    });
  }

  onCreateRoom() {
    this.roomService.createRoom().subscribe({
    next: (room) => {
      this.router.navigate(['/room', room.roomCode]);
    },
      error: (err) => console.error('Room creation error:', err),
    });
  }

  onJoinRoom() {
    if (this.joinRoomId) {
      // Navigate to the URL; ngOnInit will handle the verification/socket join
      this.router.navigate(['/room', this.joinRoomId.toUpperCase()]);
    }
  }
  onLeaveRoom() {
    if (this.roomId) {
      this.socketService.leaveRoom(this.roomId);
      // Navigate to the base room selection
      this.router.navigate(['/room']).then(() => {
        // Force a hard refresh to clear all Socket/BehaviorSubject states
        window.location.reload();
      });
    } else{
        this.router.navigate(['/room']);
    }
  }

  get allPlayersReady(): boolean {
    if (this.participants.length < 2) return false; // Optional: require at least 2 players

    return this.participants.every((p) => {
      if (p.userId === this.roomHostId) {
        return true;
      }
      return p.isReady;
    });
  }

  onGameTypeChange(type: string) {
    if (this.isHost && this.roomId) {
      this.socketService.setGameType(this.roomId, type);
    }
  }
  confirmGameType(type: string) {
    // Step 1: Set the pending type locally
    this.pendingGameType = type;
  }

  lockInGameType() {
    // Step 2: Send the final choice to the socket
    if (this.isHost && this.pendingGameType && this.roomId) {
      this.socketService.setGameType(this.roomId, this.pendingGameType);
      this.pendingGameType = null; // Clear pending state
    }
  }

  cancelPendingType() {
    this.pendingGameType = null;
  }

  get canReadyUp(): boolean {
    return !!this.currentGameType && !!this.selectedLoadoutId;
  }
  onToggleReady() {
    if (this.roomId) {
      const userId = this.authService.userId;
      this.socketService.toggleReady(this.roomId, userId);
    }
  }

  get isCurrentUserReady(): boolean {
    // Safe check for participants array
    if (!this.participants) return false;

    const currentUser = this.participants.find(
      (p) => p.username === this.authService.username
    );

    return !!currentUser?.isReady;
  }

  getSelectedLoadoutName(): string {
    const loadout = this.availableLoadouts.find(
      (l) => l.id === this.selectedLoadoutId
    );
    return loadout ? loadout.name : '';
  }

  get selectedLoadout() {
    return this.availableLoadouts.find((l) => l.id == this.selectedLoadoutId);
  }

  get filteredLoadouts() {
    if (!this.currentGameType) return [];
    // Extract "5" from "5x5"
    const sizeValue = parseInt(this.currentGameType.split('x')[0]);
    return this.availableLoadouts.filter((l) => l.gridSize === sizeValue);
  }

  getFontSize(gridSize: number): number {
    if (gridSize <= 5) return 22; // Big for 5x5
    if (gridSize <= 7) return 18; // Medium for 7x7
    return 16; // Small for 9x9
  }

  initializeGame() {
    if (this.isHost && this.roomId) {
      this.socketService.startGame(this.roomId);
    }
  }
  private autoSubmitLoadout() {
  if (this.roomId && this.selectedLoadout) {
    this.socketService.emit('submitLoadout', {
      roomCode: this.roomId,
      userId: this.authService.userId,
      loadout: this.selectedLoadout.arrangement
    });
  }
}
}
