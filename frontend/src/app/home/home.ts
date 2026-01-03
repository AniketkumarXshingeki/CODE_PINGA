import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, ChevronRight, Users, Monitor, Info, Play } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'] // Assuming SCSS, but Tailwind does most of the work
})
export class Home {
  // Icons setup (if using lucide-angular)
  readonly icons = { ChevronLeft, ChevronRight, Users, Monitor, Info, Play };

  boardSize: number = 5;
  readonly minSize: number = 5;
  readonly maxSize: number = 10;

  // Logic to change board size
  nextSize(): void {
    if (this.boardSize < this.maxSize) {
      this.boardSize++;
    }
  }

  prevSize(): void {
    if (this.boardSize > this.minSize) {
      this.boardSize--;
    }
  }

  // Helper to create an empty array for the template to iterate over
  // Represents the total cells (e.g., 25, 36, 49...)
  get gridArray(): any[] {
    return new Array(this.boardSize * this.boardSize);
  }
  
  // Dynamic grid styling
  get gridStyle() {
    return {
      'grid-template-columns': `repeat(${this.boardSize}, 1fr)`,
      'grid-template-rows': `repeat(${this.boardSize}, 1fr)`
    };
  }
  startMatch(){
    console.log("Start Match clicked");
  }
}