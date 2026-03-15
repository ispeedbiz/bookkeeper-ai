"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function TawkTo() {
  const pathname = usePathname();

  // Hide Tawk.to on dashboard/admin/cpa pages to prevent sidebar overlap
  const isDashboard =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/cpa");

  useEffect(() => {
    const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;
    if (!propertyId || !widgetId) return;

    // Don't load on dashboard pages
    if (isDashboard) {
      // Hide widget if already loaded
      const w = window as unknown as { Tawk_API?: { hideWidget?: () => void } };
      if (w.Tawk_API?.hideWidget) {
        w.Tawk_API.hideWidget();
      }
      return;
    }

    // Show widget if already loaded
    const w = window as unknown as { Tawk_API?: { showWidget?: () => void } };
    if (w.Tawk_API?.showWidget) {
      w.Tawk_API.showWidget();
      return;
    }

    // First load - inject script
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    document.head.appendChild(s);

    return () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
  }, [isDashboard]);

  return null;
}
