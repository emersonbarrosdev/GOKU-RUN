declare module '*.js' {
  export type GameRuntime = {
    start(): void; pause(): void; activateKi(): void; toggleSound(): void; destroy(): void;
  };
  export type UiBridge = { render(patch: any): void };
  export function bootGame(uiBridge: UiBridge): Promise<GameRuntime>;
}
