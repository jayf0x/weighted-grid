import { useState, useCallback, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

const getIsBreakpoint = (): boolean => window.innerWidth < MOBILE_BREAKPOINT;

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    setIsMobile(getIsBreakpoint());

    const onChange = () => setIsMobile(getIsBreakpoint());

    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []);

  return isMobile;
};
