"use client";

import { useEffect } from "react";

export default function TawkTo() {
  useEffect(() => {
    const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;
    if (!propertyId || !widgetId) return;

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    document.head.appendChild(s);

    return () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
  }, []);

  return null;
}
