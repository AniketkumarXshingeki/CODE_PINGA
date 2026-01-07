import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserPlus, Search, Send, UserCheck, ShieldAlert, X } from 'lucide-angular';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './friends.html'
})
export class Friends implements OnInit {
  readonly icons = { UserPlus, Search, Send, UserCheck, ShieldAlert, X };
  
  searchQuery: string = '';
  friends = [
    { id: 'p_101', username: 'Shadow_Stalker', status: 'online', level: 42 },
    { id: 'p_102', username: 'Cipher_Pulse', status: 'in-match', level: 15 },
    { id: 'p_103', username: 'Neon_Viper', status: 'offline', level: 28 }
  ];

  constructor() {}

  ngOnInit(): void {
    // this.loadFriends(); // Future: Fetch from backend
  }

  inviteToMatch(friendId: string) {
    console.log('Sending match invite to:', friendId);
    // Logic for socket.io or backend invite
  }

  searchMode: 'username' | 'playerId' = 'username'; // Default mode

  // ... other methods ...

  searchPlayer() {
    if (!this.searchQuery) return;
    
    console.log(`Initiating search via ${this.searchMode}:`, this.searchQuery);
    // You will send this.searchMode and this.searchQuery to your backend
  }
}