import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown, LayoutGrid, Play, Users, Monitor, Info, Eye } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { LoadoutService } from '../../services/loadout.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './home.html'
})
export class Home {
  readonly icons = { ChevronDown, LayoutGrid, Play, Users, Monitor, Info, Eye };

  boardSize: number = 5;
  selectedLoadoutId: string = '';
  availableLoadouts: any[] = [];

  constructor(private loadoutService: LoadoutService, @Inject(PLATFORM_ID) private platformId: Object) {}

 ngOnInit() {
    // Only fetch data if we are running in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadoutService.loadouts$.subscribe(data => {
        this.availableLoadouts = data.map(l => ({ ...l, content: l.arrangement }));
      });
      this.loadoutService.fetchLoadouts().subscribe();
    }
  }

  // 1. FILTER: Only show loadouts that match the chosen boardSize
  get filteredLoadouts() {
    return this.availableLoadouts.filter(l => l.gridSize === Number(this.boardSize));
  }

  // 2. RESET LOGIC: Call this when boardSize changes to prevent cross-size previews
  onBoardSizeChange() {
    this.selectedLoadoutId = ''; 
  }

  get activeLoadout() {
    return this.availableLoadouts.find(l => l.id === this.selectedLoadoutId);
  }

get previewStyle() {
  const gapSize = this.boardSize > 8 ? '2px' : this.boardSize > 6 ? '4px' : '8px';
  
  return {
    'display': 'grid',
    'grid-template-columns': `repeat(${this.boardSize}, 1fr)`,
    'gap': gapSize, // Using uniform gap often fixes alignment jitters
    'width': '100%',
    'height': 'auto'
  };
}
  // Dynamic container width calculation
get containerWidth() {
  if (this.boardSize <= 5) return '400px';
  if (this.boardSize <= 7) return '500px';
  if (this.boardSize <= 9) return '550px';
  return '600px'; // Max width for 10x10
}

// Helper for dynamic font scaling in preview
  getFontSizeClass() {
  if (this.boardSize <= 8) return 'text-[20px]';
  return 'text-[18px]';
}


  startMatch() {
    console.log('Starting match with loadout:', this.selectedLoadoutId);
  }
}