import {
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { LucideRotateCw, LucideScan, LucideZoomIn, LucideZoomOut } from '@lucide/angular';
import {
  CropState,
  INITIAL_CROP,
  MAX_ZOOM,
  Size,
  clampCrop,
  coverScale,
  rotateClockwise,
  zoomTo,
} from './crop-math';

/** Passo das setas (Shift: passo maior) e do + / −. */
const KEY_STEP = 10;
const KEY_STEP_LARGE = 40;
const ZOOM_STEP = 0.1;

/**
 * Recorte com posicionamento: arrastar (mouse ou dedo), zoom (barra, roda ou pinça), girar 90°
 * e centralizar. Teclado: setas movem, + e − dão zoom. A imagem sempre cobre a área de corte.
 * `export()` desenha o recorte num canvas e devolve um JPEG no tamanho de saída.
 */
@Component({
  selector: 'app-image-cropper',
  imports: [LucideRotateCw, LucideScan, LucideZoomIn, LucideZoomOut],
  host: { class: 'flex flex-col gap-3' },
  template: `
    <div
      #viewport
      class="relative mx-auto w-full cursor-grab touch-none overflow-hidden rounded-container bg-forest/90 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:cursor-grabbing"
      [style.aspect-ratio]="aspect()"
      [style.max-width.px]="maxWidth()"
      tabindex="0"
      role="group"
      aria-roledescription="área de corte"
      [attr.aria-label]="label()"
      aria-describedby="recorte-dica"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
      (wheel)="onWheel($event)"
      (keydown)="onKey($event)"
    >
      @if (src(); as url) {
        <img
          #image
          [src]="url"
          alt=""
          draggable="false"
          class="pointer-events-none absolute top-1/2 left-1/2 max-w-none origin-center"
          [class.invisible]="!natural()"
          [style.width.px]="natural()?.width"
          [style.height.px]="natural()?.height"
          [style.transform]="transform()"
          (load)="onLoad($event)"
          (error)="failed.set(true)"
        />
      }
      @if (round()) {
        <!-- Fora do círculo fica escurecido: é o que não aparece no avatar -->
        <div
          class="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgb(0_0_0/0.5)] ring-2 ring-white/80"
        ></div>
      } @else {
        <!-- Terços: ajudam a alinhar o corpo no centro da foto -->
        <div class="pointer-events-none absolute inset-0 ring-2 ring-white/80 ring-inset">
          <div class="absolute inset-y-0 left-1/3 w-px bg-white/40"></div>
          <div class="absolute inset-y-0 left-2/3 w-px bg-white/40"></div>
          <div class="absolute inset-x-0 top-1/3 h-px bg-white/40"></div>
          <div class="absolute inset-x-0 top-2/3 h-px bg-white/40"></div>
        </div>
      }
      @if (failed()) {
        <p
          class="absolute inset-0 flex items-center justify-center p-4 text-center text-body-md text-white"
        >
          Não foi possível abrir esta imagem. Escolha outra.
        </p>
      }
    </div>

    <!-- Zoom numa linha (a barra precisa de largura); girar e centralizar vão para baixo se faltar espaço -->
    <div
      class="mx-auto flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1"
      [style.max-width.px]="maxWidth() + 64"
    >
      <div class="flex min-w-56 flex-1 items-center gap-1">
        <button
          type="button"
          class="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
          aria-label="Diminuir zoom"
          (click)="setZoom(state().zoom - ZOOM_STEP * 2)"
        >
          <svg lucideZoomOut class="size-5"></svg>
        </button>
        <input
          type="range"
          class="h-2 min-w-0 flex-1 cursor-pointer accent-primary"
          min="1"
          [max]="maxZoom"
          step="0.01"
          aria-label="Zoom"
          [value]="state().zoom"
          [attr.aria-valuetext]="zoomText()"
          (input)="setZoom(+$any($event.target).value)"
        />
        <button
          type="button"
          class="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
          aria-label="Aumentar zoom"
          (click)="setZoom(state().zoom + ZOOM_STEP * 2)"
        >
          <svg lucideZoomIn class="size-5"></svg>
        </button>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
          aria-label="Girar 90 graus"
          (click)="rotate()"
        >
          <svg lucideRotateCw class="size-5"></svg>
        </button>
        <button
          type="button"
          class="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
          aria-label="Centralizar e tirar o zoom"
          (click)="reset()"
        >
          <svg lucideScan class="size-5"></svg>
        </button>
      </div>
    </div>
    <p id="recorte-dica" class="text-center text-body-sm text-ink-muted">
      Arraste para posicionar. Use a barra, a roda do mouse ou dois dedos para o zoom.
    </p>
  `,
})
export class ImageCropper {
  readonly file = input.required<File>();
  /** Largura ÷ altura da área de corte (1 para o avatar, 3/4 para as fotos de evolução). */
  readonly aspect = input(1);
  /** Moldura redonda (avatar). O arquivo continua quadrado. */
  readonly round = input(false, { transform: booleanAttribute });
  /** Largura do arquivo gerado, em px (a altura sai da proporção). */
  readonly outputWidth = input(1024);
  readonly maxWidth = input(320);
  readonly label = input('Ajuste da foto');

  protected readonly maxZoom = MAX_ZOOM;
  protected readonly ZOOM_STEP = ZOOM_STEP;
  protected readonly src = signal<string | null>(null);
  protected readonly natural = signal<Size | null>(null);
  protected readonly failed = signal(false);
  protected readonly state = signal<CropState>(INITIAL_CROP);
  private readonly area = signal<Size>({ width: 1, height: 1 });

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly image = viewChild<ElementRef<HTMLImageElement>>('image');
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private gesture: { state: CropState; x: number; y: number; distance: number } | null = null;

  protected readonly transform = computed(() => {
    const image = this.natural();
    if (!image) return null;
    const { x, y, zoom, rotation } = this.state();
    const scale = coverScale(image, rotation, this.area()) * zoom;
    return `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
  });
  protected readonly zoomText = computed(() => `${Math.round(this.state().zoom * 100)}%`);

  constructor() {
    // Uma URL por arquivo, liberada ao trocar de arquivo ou sair.
    effect((onCleanup) => {
      const url = URL.createObjectURL(this.file());
      this.natural.set(null);
      this.failed.set(false);
      this.state.set(INITIAL_CROP);
      this.src.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });

    // Tamanho real da área de corte (muda com a tela): a geometria é em px da área.
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (!width || !height) return;
        this.area.set({ width, height });
        this.update(this.state());
      });
      effect(() => observer.observe(this.viewport().nativeElement));
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  /** O recorte como JPEG, pronto para enviar. */
  async export(): Promise<File> {
    const image = this.image()?.nativeElement;
    const natural = this.natural();
    if (!image || !natural) throw new Error('A imagem ainda não carregou.');

    const area = this.area();
    const width = this.outputWidth();
    const height = Math.round(width / this.aspect());
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a imagem.');

    const { x, y, zoom, rotation } = this.state();
    const ratio = width / area.width;
    const scale = coverScale(natural, rotation, area) * zoom * ratio;
    // Fundo claro: PNG com transparência não vira preto no JPEG.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = 'high';
    context.translate(width / 2 + x * ratio, height / 2 + y * ratio);
    context.rotate((rotation * Math.PI) / 180);
    context.scale(scale, scale);
    context.drawImage(image, -natural.width / 2, -natural.height / 2);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    );
    if (!blob) throw new Error('Não foi possível preparar a imagem.');
    const name = this.file().name.replace(/\.[^.]+$/, '') || 'foto';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  }

  protected onLoad(event: Event): void {
    const image = event.target as HTMLImageElement;
    this.natural.set({ width: image.naturalWidth, height: image.naturalHeight });
  }

  protected setZoom(zoom: number): void {
    const natural = this.natural();
    if (natural) this.state.set(zoomTo(this.state(), zoom, natural, this.area()));
  }

  protected rotate(): void {
    const natural = this.natural();
    if (natural) this.state.set(rotateClockwise(this.state(), natural, this.area()));
  }

  protected reset(): void {
    this.state.set(INITIAL_CROP);
  }

  protected onPointerDown(event: PointerEvent): void {
    this.viewport().nativeElement.setPointerCapture?.(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.startGesture();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId) || !this.gesture) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const { x, y, distance } = this.centroid();
    const start = this.gesture;
    if (this.pointers.size >= 2 && start.distance > 0) {
      // Pinça: zoom pela distância entre os dedos, e arrasto pelo ponto médio.
      const zoomed = { ...start.state, zoom: start.state.zoom * (distance / start.distance) };
      this.update({ ...zoomed, x: start.state.x + x - start.x, y: start.state.y + y - start.y });
    } else {
      this.update({
        ...start.state,
        x: start.state.x + x - start.x,
        y: start.state.y + y - start.y,
      });
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    this.gesture = null;
    if (this.pointers.size) this.startGesture();
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.setZoom(this.state().zoom * Math.exp(-event.deltaY * 0.0015));
  }

  protected onKey(event: KeyboardEvent): void {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      const { x, y } = this.state();
      this.update({ ...this.state(), x: x + move[0], y: y + move[1] });
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.setZoom(this.state().zoom + ZOOM_STEP);
    } else if (event.key === '-') {
      event.preventDefault();
      this.setZoom(this.state().zoom - ZOOM_STEP);
    }
  }

  private update(state: CropState): void {
    const natural = this.natural();
    this.state.set(natural ? clampCrop(state, natural, this.area()) : state);
  }

  private startGesture(): void {
    const { x, y, distance } = this.centroid();
    this.gesture = { state: this.state(), x, y, distance };
  }

  private centroid(): { x: number; y: number; distance: number } {
    const points = [...this.pointers.values()];
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    const distance =
      points.length >= 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;
    return { x, y, distance };
  }
}
