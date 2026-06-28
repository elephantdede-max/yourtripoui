import { createContext, useContext, useState, ReactNode } from 'react';

export interface NotifItem {
  id: string;
  kind: 'review' | 'pending';
  title: string;
  desc: string;
  onOpen: () => void;
}

interface NotifCtx {
  notifs: NotifItem[];
  flyingId: string | null;
  bellPulse: boolean;
  showPanel: boolean;
  setShowPanel: (v: boolean) => void;
  sendToBell: (notif: NotifItem, onHidden: () => void) => void;
  removeNotif: (id: string) => void;
}

const Ctx = createContext<NotifCtx | null>(null);

export function NotifProvider({ children }: { children: ReactNode }) {
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [flyingId, setFlyingId] = useState<string | null>(null);
  const [bellPulse, setBellPulse] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const sendToBell = (notif: NotifItem, onHidden: () => void) => {
    setFlyingId(notif.id);
    setTimeout(() => {
      setNotifs(prev => prev.some(n => n.id === notif.id) ? prev : [...prev, notif]);
      setFlyingId(null);
      setBellPulse(true);
      setTimeout(() => setBellPulse(false), 450);
      onHidden();
    }, 650);
  };

  const removeNotif = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));

  return (
    <Ctx.Provider value={{ notifs, flyingId, bellPulse, showPanel, setShowPanel, sendToBell, removeNotif }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifs() {
  const c = useContext(Ctx);
  if (!c) {
    // Fallback inerte si le provider n'est pas monté (évite les crashs)
    return {
      notifs: [], flyingId: null, bellPulse: false, showPanel: false,
      setShowPanel: () => {}, sendToBell: (_n: NotifItem, cb: () => void) => cb(), removeNotif: () => {},
    } as NotifCtx;
  }
  return c;
}
