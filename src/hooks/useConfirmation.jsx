import { useRef, useState, useEffect } from 'react';
import Modal from '../components/ui/Modal/Modal';
import Button from '../components/ui/Button/Button';

export function useConfirmation() {
  const [message, setMessage] = useState('');
  const resolve = useRef(null);
  useEffect(() => () => { resolve.current?.(false); }, []);
  function finish(result) { setMessage(''); resolve.current?.(result); resolve.current = null; }
  function confirm(message) {
    resolve.current?.(false);
    setMessage(message);
    return new Promise(done => { resolve.current = done; });
  }
  const dialog = <Modal isOpen={Boolean(message)} onClose={() => finish(false)} title="Confirmar ação">
    <p>{message}</p>
    <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
      <Button onClick={() => finish(false)} variant="outline">Cancelar</Button>
      <Button onClick={() => finish(true)}>Confirmar</Button>
    </div>
  </Modal>;
  return [confirm, dialog];
}
