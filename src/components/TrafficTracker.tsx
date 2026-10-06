import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { recordVisit } from "@/lib/traffic.functions";

const SESSION_KEY = "sg_visit_session";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anonymous-session";
  }
}

/**
 * Records one visit per page per browser session, with the traffic source
 * (referrer / UTM tags). Powers the Traffic Sources report in Admin Insights.
 */
export function TrafficTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const recorded = useRef(new Set<string>());

  useEffect(() => {
    if (recorded.current.has(pathname)) return;
    recorded.current.add(pathname);
    try {
      const url = new URL(window.location.href);
      let referrerHost: string | null = null;
      try {
        referrerHost = document.referrer ? new URL(document.referrer).hostname : null;
      } catch {
        referrerHost = null;
      }
      void recordVisit({
        data: {
          sessionId: getSessionId(),
          path: pathname,
          referrerHost,
          utmSource: url.searchParams.get("utm_source"),
          utmMedium: url.searchParams.get("utm_medium"),
          utmCampaign: url.searchParams.get("utm_campaign"),
        },
      });
    } catch {
      // Tracking must never break the page.
    }
  }, [pathname]);

  return null;
}
