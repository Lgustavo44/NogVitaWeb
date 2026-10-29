import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ServerWakeBanner } from './core/http/server-wake-banner';

@Component({
  imports: [RouterOutlet, ServerWakeBanner],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
