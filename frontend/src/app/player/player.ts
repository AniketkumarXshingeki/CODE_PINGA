import { Component, OnInit } from '@angular/core';
import { Edit3, Hash, LucideAngularModule, Plus, Save, Settings, Trash2, User, Users, X } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { History } from 'lucide-angular/src/icons';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-player',
  imports: [LucideAngularModule,CommonModule,RouterModule,FormsModule],
  templateUrl: './player.html',
  styleUrl: './player.css',
})
export class Player implements OnInit {
readonly icons = { User, Hash, Users, History, Settings, Edit3, Save, Plus, Trash2, X };
  
  username = '';
  playerId = '';
 

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    // this.playerId = this.authService.getPlayerId();
  }

  deleteLoadout(id: string) {
    this.loadouts = this.loadouts.filter(l => l.id !== id);
  }
  activeFilter: number = 0; // 0 means "All"
  editingLoadout: any = null; // Tracks which loadout is in the editor
  
  loadouts = [
    { id: 'ld_1', name: 'Tactical Alpha', size: 5, content: Array(25).fill(0).map((_, i) => i + 1) },
    { id: 'ld_2', name: 'Defense Matrix', size: 6, content: Array(36).fill(0).map(() => Math.floor(Math.random() * 99)) }
  ];

  // Logic to filter loadouts based on size
  get filteredLoadouts() {
    if (this.activeFilter === 0) return this.loadouts;
    return this.loadouts.filter(l => l.size === this.activeFilter);
  }

  openEditor(loadout: any) {
    // Clone the loadout so we don't save changes until "Save" is clicked
    this.editingLoadout = JSON.parse(JSON.stringify(loadout));
  }

  saveLoadout() {
    const index = this.loadouts.findIndex(l => l.id === this.editingLoadout.id);
    if (index !== -1) {
      this.loadouts[index] = this.editingLoadout;
    }
    this.editingLoadout = null;
  }

  // Helper for grid styling in the editor
  get editorGridStyle() {
    return {
      'grid-template-columns': `repeat(${this.editingLoadout.size}, 1fr)`
    };
  }
}
