import { takeFragmentToken } from './fragment-token';

function fakeWindow(hash: string) {
  const replaceState = vi.fn();
  const window = {
    location: { hash, pathname: '/confirmar-email', search: '' },
    history: { state: null, replaceState },
  } as unknown as Window;
  return { window, replaceState };
}

describe('takeFragmentToken', () => {
  it('lê o token e o apaga da barra de endereço', () => {
    const { window, replaceState } = fakeWindow('#token=abc123');

    expect(takeFragmentToken(window)).toBe('abc123');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/confirmar-email');
  });

  it('não estraga tokens em Base64 (+, / e =)', () => {
    const { window } = fakeWindow('#token=a+b/c==');

    expect(takeFragmentToken(window)).toBe('a+b/c==');
  });

  it('decodifica caracteres codificados na URL', () => {
    const { window } = fakeWindow('#token=a%2Bb%3D');

    expect(takeFragmentToken(window)).toBe('a+b=');
  });

  it('devolve null e não mexe no histórico quando não há token', () => {
    const { window, replaceState } = fakeWindow('#outra=coisa');

    expect(takeFragmentToken(window)).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
