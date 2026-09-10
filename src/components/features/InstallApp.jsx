import { useEffect, useState, useSyncExternalStore } from 'react';
import { installController } from '../../pwa.js';
import Modal from '../ui/Modal/Modal';
import Button from '../ui/Button/Button';

export default function InstallApp() {
  const [open, setOpen] = useState(false);
  const available = useSyncExternalStore(installController.subscribe, installController.isAvailable);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
  useEffect(() => {
    const mode = window.matchMedia('(display-mode: standalone)');
    const onMode = () => setInstalled(mode.matches || navigator.standalone === true);
    const onInstalled = () => { setInstalled(true); setOpen(false); };
    window.addEventListener('appinstalled', onInstalled);
    mode.addEventListener('change', onMode);
    return () => {
      window.removeEventListener('appinstalled', onInstalled);
      mode.removeEventListener('change', onMode);
    };
  }, []);
  async function install() {
    const event = installController.takePrompt();
    if (!event) { setOpen(true); return; }
    try { setOpen(false); await event.prompt(); await event.userChoice; }
    catch { setOpen(true); }
  }
  if (installed) return null;
  return <>
    <Button variant="outline" onClick={available ? install : () => setOpen(true)}>{available ? 'Instalar app Chic Kenara' : 'Como instalar no celular'}</Button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Chic Kenara no seu celular">
      {available ? <Button onClick={install}>Instalar app Chic Kenara</Button> : <p>O navegador ainda não disponibilizou a instalação pelo botão. Esta janela contém apenas instruções; ela não instala o aplicativo.</p>}
      <p>Se você está dentro do Instagram ou WhatsApp, use o menu desse aplicativo e escolha abrir no Chrome (Android) ou Safari (iPhone).</p>
      <p><strong>iPhone ou iPad:</strong> abra este site no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p>
      <p><strong>Android:</strong> abra no Chrome e procure “Instalar app” ou “Adicionar à tela inicial” no menu.</p>
      <p><strong>Computador:</strong> no Chrome ou Edge, procure a opção de instalar na barra de endereço ou no menu do navegador.</p>
      <p>Se a opção não aparecer, continue usando o site normalmente. É preciso estar conectado para consultar o catálogo e fazer compras.</p>
    </Modal>
  </>;
}
