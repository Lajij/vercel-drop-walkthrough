export const COMPANY = "Quollridge Energy";
export const COMPANY_BLURB = "Fictional ANZ energy retailer · 410,000 customers across NSW and VIC";
export const OPS_LEAD = "Priya Nair, Duty Operations Lead";
export const CUSTOMERS_OUT = 38_400;
export const SUBURBS = 27;

export const PROMPT =
  "Storm's knocked out power for 38,400 customers across the Hunter and Central Coast. Build me a customer outage status page: affected suburbs, crew updates, restoration estimates. Make it mobile-first. I need a link I can text to customers.";

export const PAGE_FOLDER = "outage-status/";
export const PAGE_FILES = [
  { name: "index.html", size: "14 KB" },
  { name: "status.json", size: "6 KB" },
  { name: "styles.css", size: "4 KB" },
  { name: "map.svg", size: "38 KB" },
];
export const LIVE_HOST = "outage-status-q7x2.vercel.app";
export const DRAFT_HOST = "outage-map-draft-k31p.vercel.app";
export const DEPLOY_SECONDS = 38;

export type TimelineRow = { at: string; text: string; tone: "muted" | "blue" | "danger" | "warn" | "success"; note?: string };

export const BEFORE_TIMELINE: TimelineRow[] = [
  { at: "4:46pm", text: "Priya asks the agent for an outage status page", tone: "blue" },
  { at: "4:52pm", text: "Page built. Six minutes. Ready to go.", tone: "success" },
  { at: "4:53pm", text: "Stalls: hosting wants an account. Sign-up sends a verification email. The agent can't click it.", tone: "danger", note: "Hard stop" },
  { at: "5:05pm", text: "Handed to a human. IT ticket raised for a hosting account and team access.", tone: "warn" },
  { at: "7:40pm", text: "After-hours IT approves the account", tone: "warn" },
  { at: "8:50pm", text: "Page uploaded, checked, URL tested", tone: "muted" },
  { at: "9:04pm", text: "Live URL finally texted to customers", tone: "danger", note: "4h 12m after the page was ready" },
];

export const AFTER_TIMELINE: TimelineRow[] = [
  { at: "4:46pm", text: "Priya asks the agent for an outage status page", tone: "blue" },
  { at: "4:52pm", text: "Page built. Six minutes.", tone: "success" },
  { at: "4:52pm", text: "Agent drops the folder on Vercel. Live URL in 38 seconds. No account, no ticket.", tone: "success", note: "Live" },
  { at: "4:55pm", text: "Link texted to 38,400 customers, pinned on the website and the phone line", tone: "success" },
  { at: "5:31pm", text: "Priya signs in and claims it into Quollridge's Vercel team. It stays live, under company governance.", tone: "blue", note: "Claimed" },
  { at: "5:53pm", text: "The agent's unused draft was never claimed. It expires on its own. Nothing left behind.", tone: "muted", note: "Expired" },
];

/* Value model (simulated, illustrative) */
export const BEFORE_MIN_TO_LIVE = 4 * 60 + 12; // 4h12m from page ready to live
export const AFTER_SEC_TO_LIVE = DEPLOY_SECONDS;
export const CALLS_PER_HOUR = 2_300; // "when is my power back?" calls in the first hours
export const DEFLECTION = 0.45; // share of those calls a live status page answers
export const COST_PER_CALL = 9; // AUD
export const STORMS_PER_YEAR = 6;
export const STAFF_HOURS_SAVED = 5.5; // ops + IT time chasing access, per event

export const hoursFaster = BEFORE_MIN_TO_LIVE / 60 - AFTER_SEC_TO_LIVE / 3600;
export const callsInGap = Math.round(CALLS_PER_HOUR * (BEFORE_MIN_TO_LIVE / 60));
export const callsAvoided = Math.round(callsInGap * DEFLECTION);
export const costAvoided = callsAvoided * COST_PER_CALL;
export const costAvoidedYear = costAvoided * STORMS_PER_YEAR;

export const fmtInt = (n: number) => n.toLocaleString("en-AU");
export const fmtAud = (n: number) => `$${Math.round(n).toLocaleString("en-AU")}`;
export const fmtK = (n: number) => `$${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k`;
