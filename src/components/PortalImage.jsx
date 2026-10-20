import "./portalImage.css";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createThumbnailCache, preloadThumbnailImage } from "../portalThumbnailCache.mjs";
import { thumbnailReferenceKey } from "../../shared/portalThumbnailIdentity.mjs";
const Context = createContext(null);
export function PortalImageProvider({ request, children }) {
  const latest = useRef(request);
  latest.current = request;
  const read = useMemo(
    () =>
      createThumbnailCache((body, options) => latest.current(body, options), {
        loadImage: preloadThumbnailImage,
        onTiming: (event) => console.info("[Crafton thumbnails]", JSON.stringify(event))
      }),
    []
  );
  return <Context.Provider value={read}>{children}</Context.Provider>;
}
export default function PortalImage({ reference, src, alt = "", className = "", ...props }) {
  const read = useContext(Context),
    started = useRef({ key: "", time: 0 }),
    retries = useRef({ key: "", count: 0 });
  const [node, setNode] = useState(null),
    [result, setResult] = useState(null),
    [priority, setPriority] = useState(1),
    [retry, setRetry] = useState(0);
  const key = reference ? thumbnailReferenceKey(reference) : "";
  const serialized = reference ? JSON.stringify(reference) : "";
  useEffect(() => {
    if (!node || !key || !read) return;
    let root = node.parentElement;
    while (
      root &&
      root !== document.body &&
      !(/auto|scroll/.test(window.getComputedStyle(root).overflowY) && root.scrollHeight > root.clientHeight)
    )
      root = root.parentElement;
    if (root === document.body) root = null;
    const height = root?.clientHeight || window.innerHeight;
    let cancelled = false,
      subscription;
    const start = (level) => {
      setPriority((current) => Math.min(current, level));
      subscription?.prioritize(level);
      if (subscription) return;
      if (started.current.key !== key) started.current = { key, time: window.performance.now() };
      subscription = read.subscribe(JSON.parse(serialized), level);
      subscription.promise
        .then((image) => {
          if (!cancelled)
            setResult((previous) => (previous?.key === key && previous.image === image ? previous : { key, image }));
        })
        .catch((error) => {
          if (!cancelled && error.name !== "AbortError") setResult({ key, image: "" });
        });
    };
    const visible = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start(0);
      },
      { root }
    );
    const nearby = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start(1);
      },
      { root, rootMargin: `${height}px 0px` }
    );
    visible.observe(node);
    nearby.observe(node);
    // Let the initial view render first, then warm the rest of this mounted page.
    // Intersection observers promote queued work if the user scrolls sooner.
    const background = setTimeout(() => start(2), 400);
    return () => {
      cancelled = true;
      clearTimeout(background);
      visible.disconnect();
      nearby.disconnect();
      subscription?.cancel();
    };
  }, [key, serialized, read, node, retry]);
  // A failed thumbnail never falls back to downloading the original full-size image.
  const image = key && read ? (result?.key === key ? result.image : "") : src;
  return image ? (
    <img
      {...props}
      ref={setNode}
      className={className}
      src={image}
      alt={alt}
      loading={key ? "eager" : "lazy"}
      fetchpriority={priority === 0 ? "high" : "low"}
      decoding="async"
      onLoad={(event) => {
        const element = event.currentTarget;
        const resource = window.performance.getEntriesByName(element.currentSrc).at(-1);
        if (key && started.current.key === key)
          console.info(
            "[Crafton thumbnails]",
            JSON.stringify({
              phase: "image",
              kind: reference.kind || "image",
              ms: Math.round(window.performance.now() - started.current.time),
              downloadMs: resource ? Math.round(resource.duration) : null,
              transferBytes: resource?.transferSize ?? null,
              webpBytes: resource?.decodedBodySize ?? null,
              width: element.naturalWidth,
              height: element.naturalHeight
            })
          );
      }}
      onError={() => {
        if (retries.current.key !== key) retries.current = { key, count: 0 };
        if (key && read && retries.current.count++ < 1) {
          read.invalidate(reference);
          setResult(null);
          setRetry((n) => n + 1);
        }
      }}
    />
  ) : (
    <span
      ref={setNode}
      className={`portal-image-placeholder ${className}`}
      role="img"
      aria-label={alt || "Reference pending"}
    >
      {result?.key === key ? "Preview unavailable" : "Reference pending"}
    </span>
  );
}
