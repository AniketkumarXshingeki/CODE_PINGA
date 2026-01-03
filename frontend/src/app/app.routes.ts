import { Routes } from '@angular/router';
import path from 'node:path';
import { Login } from './login/login';
import { Board } from './board/board';
import { Home } from './home/home';
import { History } from './history/history';
import { Room } from './room/room';
import { About } from './about/about';

export const routes: Routes = [
   { path: '', component: Home},
   { path: 'login', component: Login },
   { path: 'play', component: Board },
   { path: 'home', component: Home},
   { path: 'history', component:History},
   { path: 'room', component:Room},
   { path: 'about', component:About},
   { path: 'register', component:Login}
];
