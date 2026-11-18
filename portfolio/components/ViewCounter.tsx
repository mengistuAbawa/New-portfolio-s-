"use client";

import { useEffect, useRef, useState } from "react";

type ViewResponse = {
  views: number;
};

function isViewResponse(value: unknown): value is ViewResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "views" in value &&
    typeof value.views === "number" &&
    Number.isSafeInteger(value.views) &&
    value.views >= 0
  );
}

function isAtPageEnd() {
  return (
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2
  );
}

export default function ViewCounter() {
  const [views, setViews] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const hasCountedRef = useRef(false);
  const isReadyRef = useRef(false);
  const isRequestPendingRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    try {
      hasCountedRef.current =
        window.sessionStorage.getItem("portfolio-view-counted") === "true";
    } catch (error) {
      console.error("Unable to read portfolio view session state:", error);
    }

    const countView = async () => {
      if (
        !isActive ||
        !isReadyRef.current ||
        hasCountedRef.current ||
        isRequestPendingRef.current ||
        !isAtPageEnd()
      ) {
        return;
      }

      isRequestPendingRef.current = true;

      try {
        const response = await fetch("/api/views", { method: "POST" });
        const data: unknown = await response.json();

        if (!response.ok || !isViewResponse(data)) {
          throw new Error("The view count service returned an invalid response.");
        }

        hasCountedRef.current = true;
        if (isActive) {
          setViews(data.views);
          setHasError(false);
        }

        try {
          window.sessionStorage.setItem("portfolio-view-counted", "true");
        } catch (error) {
          console.error("Unable to save portfolio view session state:", error);
        }
      } catch (error) {
        console.error("Unable to record portfolio view:", error);
        if (isActive) {
          setHasError(true);
        }
      } finally {
        isRequestPendingRef.current = false;
      }
    };

    const loadViewCount = async () => {
      try {
        const response = await fetch("/api/views", { cache: "no-store" });
        const data: unknown = await response.json();

        if (!response.ok || !isViewResponse(data)) {
          throw new Error("The view count service returned an invalid response.");
        }

        if (isActive) {
          setViews(data.views);
          setHasError(false);
        }
      } catch (error) {
        console.error("Unable to load portfolio view count:", error);
        if (isActive) {
          setHasError(true);
        }
      } finally {
        if (isActive) {
          isReadyRef.current = true;
          void countView();
        }
      }
    };

    window.addEventListener("scroll", countView, { passive: true });
    window.addEventListener("resize", countView);
    void loadViewCount();

    return () => {
      isActive = false;
      window.removeEventListener("scroll", countView);
      window.removeEventListener("resize", countView);
    };
  }, []);

  return (
    <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
      {hasError ? "Views unavailable" : `Views: ${views ?? "Loading..."}`}
    </p>
  );
}
