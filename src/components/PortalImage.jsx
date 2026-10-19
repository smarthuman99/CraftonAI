import "./portalImage.css";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createThumbnailCache } from "../portalThumbnailCache.mjs";
const Context = createContext(null);
export function PortalImageProvider({ request, children }) {
  const latest = useRef(request);
  latest.current = request;
  const read = useMemo(() => createThumbnailCache((body) => latest.current(body)), []);
  return <Context.Provider value={read}>{children}</Context.Provider>;
}
export default function PortalImage({ reference, src, alt = "", className = "", ...props }) {
  const read = useContext(Context),
    node = useRef(null);
  const [visible, setVisible] = useState(false),
    [result, setResult] = useState(null);
  const key = reference ? JSON.stringify(reference) : "";
  useEffect(() => {
    const target = node.current;
    if (!target || !key || !read) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [key, read]);
  useEffect(() => {
    let cancelled = false;
    if (visible && key && read)
      read(JSON.parse(key))
        .then((image) => {
          if (!cancelled) setResult({ key, image });
        })
        .catch(() => {
          if (!cancelled) setResult({ key, image: "" });
        });
    return () => {
      cancelled = true;
    };
  }, [key, read, visible]);
  // A failed thumbnail never falls back to downloading the original full-size image.
  const image = key && read ? (result?.key === key ? result.image : "") : src;
  return image ? (
    <img {...props} ref={node} className={className} src={image} alt={alt} loading="lazy" decoding="async" />
  ) : (
    <span
      ref={node}
      className={`portal-image-placeholder ${className}`}
      role="img"
      aria-label={alt || "Reference pending"}
    >
      {result?.key === key ? "Preview unavailable" : "Reference pending"}
    </span>
  );
}
