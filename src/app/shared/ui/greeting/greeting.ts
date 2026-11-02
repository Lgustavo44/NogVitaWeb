import { Component, input } from '@angular/core';
import { LucideMoon, LucideSun, LucideSunrise } from '@lucide/angular';

export type DayPeriod = 'morning' | 'afternoon' | 'night';

/** Manhã das 5h às 11h59, tarde das 12h às 17h59, noite no resto (pela hora local). */
export function dayPeriod(date: Date): DayPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

const GREETINGS: Record<DayPeriod, string> = {
  morning: 'Bom dia',
  afternoon: 'Boa tarde',
  night: 'Boa noite',
};

/** "Bom dia, Ana" (ou só "Bom dia" enquanto o nome não chegou). */
export function greetingText(period: DayPeriod, firstName: string | null): string {
  return firstName ? `${GREETINGS[period]}, ${firstName}` : GREETINGS[period];
}

/** Sol nascendo, sol ou lua ao lado da saudação. Decorativo: o texto já diz o período. */
@Component({
  selector: 'app-day-period-icon',
  imports: [LucideMoon, LucideSun, LucideSunrise],
  host: {
    class:
      'flex size-10 shrink-0 items-center justify-center rounded-full bg-soft/40 text-link sm:size-11',
    'aria-hidden': 'true',
  },
  template: `
    @switch (period()) {
      @case ('morning') {
        <svg lucideSunrise class="size-5 sm:size-6"></svg>
      }
      @case ('afternoon') {
        <svg lucideSun class="size-5 sm:size-6"></svg>
      }
      @default {
        <svg lucideMoon class="size-5 sm:size-6"></svg>
      }
    }
  `,
})
export class DayPeriodIcon {
  readonly period = input.required<DayPeriod>();
}
