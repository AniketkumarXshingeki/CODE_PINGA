import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'board/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'history/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'room/:id',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
