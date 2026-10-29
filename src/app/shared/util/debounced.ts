import { Signal, effect, signal, untracked } from '@angular/core';

/**
 * Cópia de um signal que só muda depois de `ms` sem alterações (ex.: busca enquanto a pessoa digita).
 * Chamar no contexto de injeção (campo de componente).
 */
export function debounced<T>(source: Signal<T>, ms = 350): Signal<T> {
  const result = signal(untracked(source));
  effect((onCleanup) => {
    const value = source();
    const timer = setTimeout(() => result.set(value), ms);
    onCleanup(() => clearTimeout(timer));
  });
  return result.asReadonly();
}
