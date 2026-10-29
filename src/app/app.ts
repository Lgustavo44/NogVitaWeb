import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ServerWakeBanner } from './core/http/server-wake-banner';
import { NavigationProgress } from './shared/ui/navigation-progress/navigation-progress';
import { ToastContainer } from './shared/ui/toast/toast-container';

@Component({
  imports: [NavigationProgress, RouterOutlet, ServerWakeBanner, ToastContainer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
