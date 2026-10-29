/**
 * Lê o token dos links dos e-mails (`/confirmar-email#token=...`) e o apaga da barra de endereço,
 * para ele não ficar no histórico do navegador.
 *
 * Não usa URLSearchParams de propósito: ele troca "+" por espaço e estragaria tokens em Base64.
 */
export function takeFragmentToken(window: Window | null): string | null {
  if (!window) {
    return null;
  }
  const fragment = window.location.hash.replace(/^#/, '');
  const pair = fragment.split('&').find((part) => part.startsWith('token='));
  const raw = pair?.slice('token='.length);
  if (!raw) {
    return null;
  }

  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.search,
  );
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
