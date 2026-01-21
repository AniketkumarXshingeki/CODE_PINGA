import { Routes } from '@angular/router';
import path from 'node:path';
import { Login } from './login/login';
import { Board } from './board/board';
import { Home } from './home/home';
import { History } from './history/history';
import { Room } from './room/room';
import { About } from './about/about';
import { Player } from './player/player';
import { Friends } from './friends/friends';

export const routes: Routes = [
   { path: '', component: Home},
   { path: 'login', component: Login },
   { path: 'board/:id', component: Board },
   { path: 'home', component: Home},
   { path: 'room', component:Room},
   { path: 'history', component:History},
   { path: 'history/:id', component:History},
   { path: 'room/:id', component: Room },
   { path: 'about', component:About},
   { path: 'register', component:Login},
   { path: 'player', component:Player},
   { path: 'friends', component:Friends}
];
