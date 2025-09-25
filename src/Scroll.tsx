import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export function ScrollOnNav() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (hash) return;
    if (navType === "PUSH" || navType === "REPLACE") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname, hash, navType]);

  return null;
}
