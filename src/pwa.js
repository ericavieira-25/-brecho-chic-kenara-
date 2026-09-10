// Capture before React waits for the account request or mounts the footer.
export function createInstallController(target) {
  let pending = null;
  const listeners = new Set();
  const notify = () => listeners.forEach(listener => listener());
  const capture = event => { event.preventDefault(); pending = event; notify(); };
  const installed = () => { pending = null; notify(); };
  target.addEventListener('beforeinstallprompt', capture);
  target.addEventListener('appinstalled', installed);
  return {
    isAvailable: () => pending !== null,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    takePrompt() { const event = pending; pending = null; notify(); return event; },
    dispose() {
      target.removeEventListener('beforeinstallprompt', capture);
      target.removeEventListener('appinstalled', installed);
      listeners.clear();
    },
  };
}

export const installController = typeof window === 'undefined' ? null : createInstallController(window);
