// Capture before React waits for the account request or mounts the footer.
export function createInstallController(target) {
  let pending = null;
  const capture = event => { event.preventDefault(); pending = event; };
  const installed = () => { pending = null; };
  target.addEventListener('beforeinstallprompt', capture);
  target.addEventListener('appinstalled', installed);
  return {
    takePrompt() { const event = pending; pending = null; return event; },
    dispose() {
      target.removeEventListener('beforeinstallprompt', capture);
      target.removeEventListener('appinstalled', installed);
    },
  };
}

export const installController = typeof window === 'undefined' ? null : createInstallController(window);
