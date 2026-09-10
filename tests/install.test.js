import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstallController } from '../src/pwa.js';

test('install prompt survives delayed UI mount and can only be used once', () => {
  const target = new EventTarget();
  const controller = createInstallController(target);
  const event = new Event('beforeinstallprompt', { cancelable: true });
  target.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  // The footer can mount after the event, without losing the browser prompt.
  assert.equal(controller.takePrompt(), event);
  assert.equal(controller.takePrompt(), null);
  controller.dispose();
});

test('completed installation discards pending prompt', () => {
  const target = new EventTarget();
  const controller = createInstallController(target);
  target.dispatchEvent(new Event('beforeinstallprompt', {cancelable:true}));
  target.dispatchEvent(new Event('appinstalled'));
  assert.equal(controller.takePrompt(), null);
  controller.dispose();
});
