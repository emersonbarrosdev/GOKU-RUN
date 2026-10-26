import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

type GameRuntime = {
  start(): void;
  pause(): void;
  activateKi(): void;
  toggleSound(): void;
  destroy(): void;
};

type UiState = {
  state: string; panelHidden: boolean; hudHidden: boolean; kiHidden: boolean;
  startText: string; title: string; subtitle: string; result: string; instructions: string;
  score: string; lives: number; phaseLabel: string; phaseName: string; progress: string;
  kiFill: string; kiReady: boolean; kiActive: boolean; kiLabel: string; kiCaption: string;
  kiAria: string; bannerHidden: boolean; banner: string; soundText: string;
};

const initialUi: UiState = {
  state:'loading',panelHidden:false,hudHidden:true,kiHidden:true,startText:'JOGAR',title:'Preparando a aventura…',
  subtitle:'Carregando os cinco mundos',result:'',instructions:'Toque na tela para pular · Toque de novo para pulo duplo',
  score:'00000',lives:3,phaseLabel:'FASE 1 / 5',phaseName:'NAMEK',progress:'0%',kiFill:'0%',kiReady:false,
  kiActive:false,kiLabel:'KI',kiCaption:'0%',kiAria:'KI carregando 0%',bannerHidden:true,banner:'',soundText:'SOM LIGADO',
};

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './game.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent implements AfterViewInit, OnDestroy {
  readonly ui = signal(initialUi);
  private runtime?: GameRuntime;
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    const { bootGame } = await import('../../js/bootstrap.js');
    const runtime = await bootGame({
      render: (patch: Partial<UiState>) => this.ui.update(current => ({...current,...patch})),
    });
    if (this.destroyed) runtime.destroy();
    else this.runtime = runtime;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.runtime?.destroy();
  }

  start(): void { this.runtime?.start(); }
  pause(): void { this.runtime?.pause(); }
  activateKi(): void { this.runtime?.activateKi(); }
  toggleSound(): void { this.runtime?.toggleSound(); }
}
