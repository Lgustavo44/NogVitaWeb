import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import {
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideChevronDown,
  LucideDynamicIcon,
  LucideIcon,
  LucideLogOut,
  LucideMenu,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucideShieldCheck,
  LucideStethoscope,
  LucideUserRound,
  LucideX,
} from '@lucide/angular';
import { filter, map } from 'rxjs';
import { AREAS, Area } from '../../../core/auth/areas';
import { Auth } from '../../../core/auth/auth';
import { Role } from '../../../core/auth/auth.models';
import { CurrentUser } from '../../../core/auth/current-user';
import { Logo } from '../../ui/logo/logo';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

/** Item do menu da área. Sem `link`, aparece como "Em breve" (tela ainda não construída). */
export interface NavItem {
  label: string;
  /** Rótulo da barra inferior do celular, onde cabe pouco texto. */
  shortLabel?: string;
  icon: LucideIcon;
  link?: string;
  /** Destaca só na URL exata (para o "Início" não ficar ativo em todas as telas). */
  exact?: boolean;
  /** Aparece na barra inferior do celular (até 5 itens). Sem nenhum marcado, usa os 5 primeiros. */
  bottom?: boolean;
}

/** `bottom`: barra inferior no celular (paciente). `drawer`: menu em gaveta (nutricionista e admin). */
export type MobileNav = 'bottom' | 'drawer';

const AREA_ICONS: Record<Role, LucideIcon> = {
  Patient: LucideUserRound,
  Nutritionist: LucideStethoscope,
  Admin: LucideShieldCheck,
};
const COLLAPSED_KEY = 'nv-sidebar-collapsed';

/**
 * Layout das áreas logadas: menu lateral, cabeçalho e menu da conta.
 * Cada área o usa com o próprio menu e projeta o `<router-outlet>` no conteúdo.
 *
 * Desktop (>= 1024 px): menu lateral fixo, que pode ser recolhido.
 * Tablet e celular: o menu vira gaveta; no celular, o paciente usa a barra inferior.
 */
@Component({
  selector: 'app-shell',
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkTrapFocus,
    Logo,
    LucideChevronDown,
    LucideDynamicIcon,
    LucideLogOut,
    LucideMenu,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucideX,
    RouterLink,
    RouterLinkActive,
    ThemeToggle,
  ],
  host: {
    class: 'block',
    '(document:keydown.escape)': 'closeDrawer()',
  },
  templateUrl: './app-shell.html',
})
export class AppShell {
  private readonly auth = inject(Auth);
  private readonly currentUser = inject(CurrentUser);
  private readonly router = inject(Router);
  private readonly storage = localStorageOf(inject(DOCUMENT));

  readonly area = input.required<Role>();
  readonly navigation = input.required<NavItem[]>();
  readonly userName = input<string | null>(null);
  /** Linha abaixo do nome (ex.: o CRN do nutricionista). Sem ela, mostra o nome da área. */
  readonly userDetail = input<string | null>(null);
  /** Título acima dos itens do menu lateral (ex.: "Menu clínico"). */
  readonly menuTitle = input('Menu');
  readonly mobileNav = input<MobileNav>('drawer');

  protected readonly drawerOpen = signal(false);
  protected readonly collapsed = signal(this.storage?.getItem(COLLAPSED_KEY) === 'true');
  protected readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 1024px)')
      .pipe(map((state) => state.matches)),
    { initialValue: true },
  );

  protected readonly currentArea = computed(() => AREAS[this.area()]);
  protected readonly currentAreaIcon = computed(() => AREA_ICONS[this.area()]);
  protected readonly subtitle = computed(() => this.userDetail() ?? this.currentArea().label);
  protected readonly homeLink = computed(() => this.currentArea().path);
  protected readonly otherAreas = computed(() =>
    this.currentUser
      .roles()
      .filter((role) => role !== this.area())
      .map((role) => ({ ...AREAS[role], icon: AREA_ICONS[role] })),
  );
  protected readonly displayName = computed(() => this.userName() ?? this.currentArea().label);
  protected readonly initials = computed(() => initialsOf(this.displayName()));
  protected readonly bottomItems = computed(() => {
    const marked = this.navigation().filter((item) => item.bottom);
    return (marked.length > 0 ? marked : this.navigation()).slice(0, 5);
  });
  /** No desktop com o menu recolhido, os textos ficam só para o leitor de tela. */
  protected readonly compactSidebar = computed(() => this.isDesktop() && this.collapsed());

  private readonly injector = inject(Injector);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.drawerOpen.set(false);
        this.main().nativeElement.scrollTo({ top: 0 });
      });
  }

  /** Ao abrir a gaveta, o foco vai para dentro dela; ao fechar, volta para o botão que a abriu. */
  protected openDrawer(): void {
    this.drawerOpen.set(true);
    afterNextRender(() => this.closeButton().nativeElement.focus(), { injector: this.injector });
  }

  protected closeDrawer(): void {
    if (!this.drawerOpen()) {
      return;
    }
    this.drawerOpen.set(false);
    this.menuButton().nativeElement.focus();
  }

  protected toggleCollapsed(): void {
    const collapsed = !this.collapsed();
    this.collapsed.set(collapsed);
    try {
      this.storage?.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      // Sem armazenamento: a escolha vale só nesta página.
    }
  }

  protected goTo(area: Area): void {
    void this.router.navigateByUrl(area.path);
  }

  protected logout(): void {
    void this.auth.logout();
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function localStorageOf(document: Document): Storage | null {
  try {
    return document.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}
