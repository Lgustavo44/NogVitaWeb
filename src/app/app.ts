import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ServerWakeBanner } from './core/http/server-wake-banner';
import { NavigationProgress } from './shared/ui/navigation-progress/navigation-progress';

@Component({
  imports: [NavigationProgress, RouterOutlet, ServerWakeBanner],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
