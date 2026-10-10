export type DriftMethodName =
  | "identify"
  | "config"
  | "track"
  | "reset"
  | "debug"
  | "show"
  | "ping"
  | "page"
  | "hide"
  | "off"
  | "on";

export interface DriftApi {
  widget: {
    show(): void;
    hide(): void;
  };
}

export type DriftMethod = (...args: unknown[]) => DriftQueue;

export type DriftOn = (
  event: string,
  callback: (api: DriftApi) => void
) => DriftQueue;

export interface DriftSnippet {
  init?: boolean;
  invoked?: boolean;
  methods?: readonly DriftMethodName[];
  factory?: (method: DriftMethodName) => DriftMethod;
  load?: (appId: string) => void;
  SNIPPET_VERSION?: string;
}

export type DriftQueue = Array<unknown[]> &
  DriftSnippet & { [K in Exclude<DriftMethodName, "on">]?: DriftMethod } & {
    on?: DriftOn;
  };

declare global {
  interface Window {
    drift?: DriftQueue;
    driftApi?: DriftApi;
    driftShouldShow?: boolean;
  }
}
