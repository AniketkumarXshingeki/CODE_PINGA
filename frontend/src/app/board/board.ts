import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-board',
  imports: [CommonModule],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board implements OnInit {
  roomId: string = '';
  matchData: any;
  board: { value: number; marked: boolean }[] = [];
  linesCount: number = 0;
  // Selection Logic
  selectedNumber: number | null = null;
  drawnNumbers: number[] = [];
  private destroyRef = inject(DestroyRef);
  // Turn Logic
  currentTurnId: string = '';
  myUserId: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private authService: AuthService
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.matchData = navigation?.extras.state?.['matchData'];
    this.myUserId = this.authService.getUserId();
  }

  ngOnInit() {
    if (!this.matchData) {
      this.router.navigate(['/room']);
      return;
    }

    this.roomId = this.route.snapshot.params['id'];
    this.currentTurnId = this.matchData.activeTurnId;

    // Initialize Board from the loadout passed in state
    // Assuming matchData contains the local player's loadout arrangement
    this.board = this.matchData.myLoadout.map((val: number) => ({
      value: val,
      marked: false
    }));

    // Listen for numbers called by anyone
    this.socketService.numberUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef)) // This is the "Safety Valve"
      .subscribe((data) => {
        this.handleIncomingNumber(data.number, data.nextTurnId);
      });
  }

  get isMyTurn(): boolean {
    return this.myUserId === this.currentTurnId;
  }

  onCellClick(num: number) {
    if (!this.isMyTurn) return;
    const cell = this.board.find(c => c.value === num);
    if (cell && !cell.marked) {
      this.selectedNumber = num;
    }
  }

  confirmSelection() {
    if (this.selectedNumber && this.isMyTurn) {
      this.socketService.emit('callNumber', {
        roomCode: this.roomId,
        number: this.selectedNumber
      });
      this.selectedNumber = null;
    }else {
    console.warn('Cannot emit: No number selected or not your turn.');
  }
  }

  private handleIncomingNumber(num: number, nextId: string) {
  // Mark the number on the player's local grid
  const cell = this.board.find(c => c.value === num);
  if (cell) {
    cell.marked = true;
    this.checkBingo();
  }
  
  // Add to the history log
  this.drawnNumbers.push(num);
  
  // Update the current turn
  this.currentTurnId = nextId;
}
private checkBingo() {
  const size = Math.sqrt(this.board.length); // e.g., 7 for 7x7
  let lines = 0;

  // Check Rows
  for (let i = 0; i < size; i++) {
    const row = this.board.slice(i * size, (i + 1) * size);
    if (row.every(cell => cell.marked)) lines++;
  }

  // Check Columns
  for (let i = 0; i < size; i++) {
    const col = [];
    for (let j = 0; j < size; j++) {
      col.push(this.board[i + j * size]);
    }
    if (col.every(cell => cell.marked)) lines++;
  }

  // Check Diagonals
  const diag1 = [];
  const diag2 = [];
  for (let i = 0; i < size; i++) {
    diag1.push(this.board[i * (size + 1)]);
    diag2.push(this.board[(i + 1) * (size - 1)]);
  }
  if (diag1.every(cell => cell.marked)) lines++;
  if (diag2.every(cell => cell.marked)) lines++;

  this.linesCount = lines;

  // 2. If the goal is reached, notify the server!
  if (this.linesCount >= 7) {
    this.socketService.emit('claimWin', { 
      roomCode: this.roomId, 
      sessionId: this.matchData.sessionId 
    });
  }
}

}
