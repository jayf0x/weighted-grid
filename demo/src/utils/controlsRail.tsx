import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type RailCtx = {
  activeId: string | null;
  activeNode: ReactNode;
  register: (id: string, node: ReactNode) => void;
  unregister: (id: string) => void;
  setActiveId: (id: string) => void;
};

const ControlsRailContext = createContext<RailCtx | null>(null);

/** Owns "which example is active" + a mutable `id -> control panel` registry. Sits once near the
 * root (`App.tsx`) so `<ControlRail>` and every example's `useSectionControls` share one instance. */
export function ControlsRailProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<ReactNode>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const registryRef = useRef(new Map<string, ReactNode>());

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    setActiveNode(registryRef.current.get(id) ?? null);
  }, []);

  const register = useCallback((id: string, node: ReactNode) => {
    registryRef.current.set(id, node);
    if (activeIdRef.current === id) setActiveNode(node);
  }, []);

  const unregister = useCallback((id: string) => {
    registryRef.current.delete(id);
  }, []);

  const value = useMemo(
    () => ({ activeId, activeNode, register, unregister, setActiveId }),
    [activeId, activeNode, register, unregister, setActiveId],
  );

  return <ControlsRailContext.Provider value={value}>{children}</ControlsRailContext.Provider>;
}

function useControlsRailContext(): RailCtx {
  const ctx = useContext(ControlsRailContext);
  if (!ctx) throw new Error('useControlsRailContext must be used within a ControlsRailProvider');
  return ctx;
}

/** Reads the currently-active example's control panel — the only thing `<ControlRail>` needs. */
export function useActiveRailContent() {
  const { activeId, activeNode } = useControlsRailContext();
  return { activeId, activeNode };
}

const ACTIVATION_BAND = '-15% 0px -70% 0px';

/** Called by one example: registers `node` as its control panel and, once its section (`ref`)
 * crosses the activation band near the top of the viewport, marks it the active one. Render `ref`
 * onto the section's root element — the observer watches the whole section, not just its rail
 * panel, so a tall example stays "active" while any part of it is in the reading position. */
export function useSectionControls<T extends HTMLElement>(id: string, node: ReactNode) {
  const { register, unregister, setActiveId } = useControlsRailContext();
  const ref = useRef<T>(null);

  useEffect(() => {
    register(id, node);
    return () => unregister(id);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActiveId(id);
      },
      { rootMargin: ACTIVATION_BAND, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return ref;
}
