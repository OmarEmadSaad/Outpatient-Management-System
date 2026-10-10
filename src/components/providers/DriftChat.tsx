"use client";

import { useEffect } from "react";
import type { DriftMethodName, DriftQueue } from "@/types/drift";
import { useAuth } from "./AuthProvider";

const DRIFT_APP_ID = "dzuguuxtz63t";
const DRIFT_METHODS: readonly DriftMethodName[] = [
  "identify",
  "config",
  "track",
  "reset",
  "debug",
  "show",
  "ping",
  "page",
  "hide",
  "off",
  "on",
];

const applyVisibility = (shouldShow: boolean) => {
  const api = window.driftApi;
  if (!api) return;
  if (shouldShow) api.widget.show();
  else api.widget.hide();
};

const loadDrift = () => {
  const drift: DriftQueue = (window.drift = window.drift || []);
  if (drift.init || drift.invoked) return;

  drift.invoked = true;
  drift.methods = DRIFT_METHODS;
  const factory = (method: DriftMethodName) =>
    function (...args: unknown[]) {
      drift.push([method, ...args]);
      return drift;
    };
  drift.factory = factory;
  DRIFT_METHODS.forEach((method) => {
    drift[method] = factory(method);
  });
  const load = (appId: string) => {
    const cacheWindow = 3e5;
    const cacheBuster =
      Math.ceil(Number(new Date()) / cacheWindow) * cacheWindow;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://js.driftt.com/include/${cacheBuster}/${appId}.js`;
    document.head.appendChild(script);
  };
  drift.load = load;
  drift.SNIPPET_VERSION = "0.3.1";
  load(DRIFT_APP_ID);
  drift.on?.("ready", (api) => {
    window.driftApi = api;
    applyVisibility(Boolean(window.driftShouldShow));
  });
};

export default function DriftChat() {
  const { user } = useAuth();
  const shouldShow = Boolean(user);

  useEffect(() => {
    window.driftShouldShow = shouldShow;
    if (shouldShow && !window.drift) loadDrift();
    applyVisibility(shouldShow);
  }, [shouldShow]);

  return null;
}
