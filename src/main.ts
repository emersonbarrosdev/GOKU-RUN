import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { GameComponent } from './app/game.component';

bootstrapApplication(GameComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch(error => console.error(error));
