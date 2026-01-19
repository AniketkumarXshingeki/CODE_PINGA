import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArrowLeft, ArrowRight, Calendar, LucideAngularModule, Medal, Pause, Play, PlayCircle, SkipBack, SkipForward, Trophy } from 'lucide-angular';


interface MatchSummary {
  sessionId: string;
  playedAt: string;
  myPosition: number | null;
  winnerName: string;
  gridSize: number;
}


interface ReplayData {
  id: string;
  gridSize: number;
  drawnNumbers: number[];
  winnerId: string;
  participants: any[];
}
@Component({
  selector: 'app-history',
  imports: [LucideAngularModule,CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History implements OnInit{

  viewMode: 'LIST' | 'DETAIL' = 'LIST';

  recentMatches: MatchSummary[] = [];
  isListLoading = true;

  selectedMatch: ReplayData | null = null;
  isDetailLoading = false;
  
  // Playback State
  currentStep: number = 0; // Tracks which turn we are viewing (0 to total turns)
  isPlaying: boolean = false;
  intervalId: any;

  // View State
  selectedPlayerId: string | null = null;
  currentBoard: { value: number; marked: boolean }[] = [];

  currentPage = 0;  //Pagination
  hasMore = false; // Controls visibility of the button
  isLoadingMore = false; // For the button spinner
  
  // Icons for template
  icons = { Play, Pause, SkipBack, SkipForward,Trophy,Medal, Calendar, PlayCircle, ArrowRight, ArrowLeft };

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.loadRecentMatches(0);
  }


  loadRecentMatches(page:number) {
    if (page === 0) this.isListLoading = true;
    else this.isLoadingMore = true;

    this.http.get<any>(`http://localhost:3000/profile/history?page=${page}`)
      .subscribe({
        next: (response) => {
          // If page 0, replace list. If page 1+, append to list.
          if (page === 0) {
            this.recentMatches = response.data;
          } else {
            this.recentMatches = [...this.recentMatches, ...response.data];
          }
          
          this.hasMore = response.hasMore;
          this.currentPage = page;
          
          this.isListLoading = false;
          this.isLoadingMore = false;
        },
        error: (err) => {
          console.error(err);
          this.isListLoading = false;
          this.isLoadingMore = false;
        }
      });
  }

  loadNextPage() {
    if (this.hasMore && !this.isLoadingMore) {
      this.loadRecentMatches(this.currentPage + 1);
    }
  }

  openReplay(sessionId: string) {
    this.viewMode = 'DETAIL';
    this.isDetailLoading = true;
    
    // Stop any previous intervals just in case
    this.stopAutoPlay();

    this.http.get<ReplayData>(`http://localhost:3000/profile/history/${sessionId}`)
      .subscribe({
        next: (data) => {
          this.selectedMatch = data;
          this.currentStep = 0;
          this.selectedPlayerId = data.participants[0]?.userId; // Default to first player
          this.updateBoardView();
          this.isDetailLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.viewMode = 'LIST'; // Go back on error
        }
      });
  }

  closeReplay() {
    this.stopAutoPlay();
    this.selectedMatch = null;
    this.viewMode = 'LIST';
  }

  stopAutoPlay() {
    this.isPlaying = false;
    clearInterval(this.intervalId);
  }

  // --- CONTROLS ---

  nextTurn() {
    if (!this.selectedMatch || this.currentStep >= this.selectedMatch.drawnNumbers.length) return;
    this.currentStep++;
    this.updateBoardView();
  }

  prevTurn() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateBoardView();
    }
  }

  toggleAutoPlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.intervalId = setInterval(() => {
        if (this.currentStep < (this.selectedMatch?.drawnNumbers.length || 0)) {
          this.nextTurn();
        } else {
          this.toggleAutoPlay(); // Stop at end
        }
      }, 1000); // 1 second per turn
    } else {
      clearInterval(this.intervalId);
    }
  }


changeStep(delta: number) {
    if (!this.selectedMatch) return;
    const newStep = this.currentStep + delta;
    if (newStep >= 0 && newStep <= this.selectedMatch.drawnNumbers.length) {
      this.currentStep = newStep;
      this.updateBoardView();
    }
  }

  selectPlayer(userId: string) {
    this.selectedPlayerId = userId;
    this.updateBoardView();
  }

  private updateBoardView() {
    if (!this.selectedMatch || !this.selectedPlayerId) return;

    const player = this.selectedMatch.participants.find(p => p.userId === this.selectedPlayerId);
    const calledSet = new Set(this.selectedMatch.drawnNumbers.slice(0, this.currentStep));
    
    // Safety check for loadout format
    if (!player) return;
    const loadout = Array.isArray(player.loadout) ? player.loadout : [];

    this.currentBoard = loadout.map((val: number) => ({
      value: val,
      marked: calledSet.has(val)
    }));
  }
  
  // Getters for template
  get lastCalled() {
    return (this.currentStep > 0 && this.selectedMatch) 
      ? this.selectedMatch.drawnNumbers[this.currentStep - 1] 
      : null;
  }

}
