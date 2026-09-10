import { useEffect, useRef, useState } from 'react';
import Modal from '../ui/Modal/Modal';
import Button from '../ui/Button/Button';

export default function InstallApp() {
  const prompt = useRef(null);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
  useEffect(() => {
    const mode = window.matchMedia('(display-mode: standalone)');
    const onMode = () => setInstalled(mode.matches || navigator.standalone === true);
    const onPrompt = event => { event.preventDefault(); prompt.current = event; };
    const onInstalled = () => { setInstalled(true); setOpen(false); prompt.current = null; };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    mode.addEventListener('change', onMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mode.removeEventListener('change', onMode);
    };
  }, []);
  async function install() {
    if (!prompt.current) { setOpen(true); return; }
    const event = prompt.current;
    prompt.current = null;
    try { await event.prompt(); await event.userChoice; }
    catch { setOpen(true); }
  }
  if (installed) return null;
  return <>
    <Button variant="outline" onClick={install}>Instalar app Chic Kenara</Button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Chic Kenara no seu celular">
      <p>Tenha a loja na tela inicial, com acesso pelo ícone do app.</p>
      <p><strong>iPhone ou iPad:</strong> abra este site no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p>
      <p><strong>Android:</strong> abra no Chrome e procure “Instalar app” ou “Adicionar à tela inicial” no menu.</p>
      <p><strong>Computador:</strong> no Chrome ou Edge, procure a opção de instalar na barra de endereço ou no menu do navegador.</p>
      <p>Se a opção não aparecer, continue usando o site normalmente. É preciso estar conectado para consultar o catálogo e fazer compras.</p>
    </Modal>
  </>;
}
