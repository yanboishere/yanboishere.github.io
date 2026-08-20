export function requestAppFullscreen(el?: HTMLElement | null): Promise<void> {
  const node = el ?? document.documentElement;
  const req =
    node.requestFullscreen?.bind(node) ||
    (node as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(node);
  if (!req) return Promise.resolve();
  try {
    return Promise.resolve(req()).catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

export function exitAppFullscreen(): Promise<void> {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
  const exit = document.exitFullscreen?.bind(document) || doc.webkitExitFullscreen?.bind(document);
  if (!exit || !isAppFullscreen()) return Promise.resolve();
  try {
    return Promise.resolve(exit()).catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

export function isAppFullscreen(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}
