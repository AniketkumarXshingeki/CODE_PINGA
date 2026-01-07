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


  get activeLoadout() {
    return this.availableLoadouts.find(l => l.id === this.selectedLoadoutId);
  }

  get previewStyle() {
    return {
      'grid-template-columns': `repeat(${this.boardSize}, 1fr)`,
      'grid-template-rows': `repeat(${this.boardSize}, 1fr)`
    };
  }

  startMatch() {
    console.log('Starting match with loadout:', this.selectedLoadoutId);
  }
}