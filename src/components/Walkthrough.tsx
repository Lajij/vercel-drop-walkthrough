"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  AFTER_TIMELINE,
  BEFORE_TIMELINE,
  CALLS_PER_HOUR,
  COMPANY,
  COMPANY_BLURB,
  COST_PER_CALL,
  CUSTOMERS_OUT,
  DEFLECTION,
  DEPLOY_SECONDS,
  DRAFT_HOST,
  LIVE_HOST,
  OPS_LEAD,
  PAGE_FILES,
  PAGE_FOLDER,
  PROMPT,
  STAFF_HOURS_SAVED,
  STORMS_PER_YEAR,
  SUBURBS,
  callsAvoided,
  callsInGap,
  costAvoided,
  costAvoidedYear,
  fmtAud,
  fmtInt,
  hoursFaster,
  type TimelineRow,
} from "./data";
import { Panel, VercelMark } from "./ui";

const STEPS = [
  { key: "storm", label: "The storm" },
  { key: "wall", label: "The account wall" },
  { key: "drop", label: "Drop it" },
  { key: "share", label: "Share it" },
  { key: "claim", label: "Claim it" },
  { key: "value", label: "The value" },
] as const;

const TONE: Record<TimelineRow["tone"], { dot: string; text: string; chip: string }> = {
  muted: { dot: "bg-subtle", text: "text-muted", chip: "border-border text-muted" },
  blue: { dot: "bg-blue", text: "text-foreground", chip: "border-blue/40 text-blue" },
  danger: { dot: "bg-danger", text: "text-foreground", chip: "border-danger/50 text-danger" },
  warn: { dot: "bg-warn", text: "text-foreground", chip: "border-warn/50 text-warn" },
  success: { dot: "bg-success", text: "text-foreground", chip: "border-success/40 text-success" },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mmss = (s: number) => {
  const v = Math.max(0, Math.floor(s));
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

const DEPLOY_LOG = [
  `Received ${PAGE_FOLDER} · ${PAGE_FILES.length} files · 62 KB`,
  "Static site detected",
  "Uploading to Vercel",
  "Publishing to production",
  "Live on the global network",
];

type DeployPhase = "idle" | "uploading" | "live";

export function Walkthrough() {
  const [step, setStep] = useState(0);
  const [deploy, setDeploy] = useState<DeployPhase>("idle");
  const [deployedAt, setDeployedAt] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [fastForward, setFastForward] = useState(false);

  const go = useCallback((n: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, n))), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(step + 1);
      if (e.key === "ArrowLeft") go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, step]);

  const resetAll = () => {
    setDeploy("idle");
    setDeployedAt(null);
    setClaimed(false);
    setFastForward(false);
    setStep(0);
  };

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <VercelMark className="h-4 w-4" />
            <span className="text-subtle">/</span>
            <span className="text-sm font-medium">Vercel Drop</span>
            <span className="hidden rounded-full border border-border px-2 py-0.5 text-[11px] text-muted sm:inline">
              No account needed
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{COMPANY}</div>
            <div className="hidden text-[11px] text-subtle sm:block">{COMPANY_BLURB}</div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-3">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => go(i)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                i === step
                  ? "border-white bg-white text-black"
                  : i < step
                    ? "border-border text-foreground hover:border-white/40"
                    : "border-border text-subtle hover:text-muted"
              }`}
            >
              <span className="font-mono">{i + 1}</span>
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Body */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <div key={step} className="fade-in">
          {step === 0 && <StormStep />}
          {step === 1 && <WallStep />}
          {step === 2 && (
            <DropStep
              deploy={deploy}
              onDeploy={async () => {
                setDeploy("uploading");
              }}
              onLive={() => {
                setDeploy("live");
                setDeployedAt(Date.now());
              }}
            />
          )}
          {step === 3 && <ShareStep live={deploy === "live"} onGoDrop={() => go(2)} />}
          {step === 4 && (
            <ClaimStep
              live={deploy === "live"}
              deployedAt={deployedAt}
              claimed={claimed}
              fastForward={fastForward}
              onClaim={() => setClaimed(true)}
              onFastForward={() => setFastForward(true)}
              onGoDrop={() => go(2)}
            />
          )}
          {step === 5 && <ValueStep />}
        </div>
      </main>

      {/* Footer nav */}
      <footer className="sticky bottom-0 z-20 border-t border-border bg-black/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition hover:border-white/40 disabled:opacity-30"
          >
            ← Back
          </button>
          <div className="flex flex-col items-center text-center">
            <span className="font-mono text-[11px] text-subtle">
              Step {step + 1} of {STEPS.length} · {STEPS[step].label}
            </span>
            <span className="text-[10.5px] text-subtle/80">Simulated demo, fictional company. Numbers are illustrative.</span>
          </div>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => go(step + 1)}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={resetAll}
              className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition hover:border-white/40"
            >
              Start again
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">{children}</div>;
}

function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-7 max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{children}</h1>
      {sub ? <p className="mt-3 text-base leading-relaxed text-muted">{sub}</p> : null}
    </div>
  );
}

/* Step 1 ------------------------------------------------------------- */

function StormStep() {
  return (
    <div>
      <Eyebrow>Saturday · 4:40pm · Hunter and Central Coast</Eyebrow>
      <Title
        sub={
          <>
            An east coast low rolls in. Lines are down across {SUBURBS} suburbs. Every one of those customers wants the
            same thing: to know when the power is coming back.
          </>
        }
      >
        {fmtInt(CUSTOMERS_OUT)} customers just lost power.
      </Title>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Customers off supply" value={fmtInt(CUSTOMERS_OUT)} tone="danger" />
        <Stat label="Suburbs affected" value={String(SUBURBS)} />
        <Stat label="“When's my power back?” calls" value={`${fmtInt(CALLS_PER_HOUR)}/hr`} tone="warn" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Ops channel" badge="4:46pm">
          <div className="space-y-3">
            <div className="flex gap-3">
              <Avatar label="PN" />
              <div>
                <div className="text-xs text-subtle">{OPS_LEAD}</div>
                <div className="mt-1 rounded-lg border border-border bg-card-2 p-3 text-sm leading-relaxed">{PROMPT}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Avatar label="AI" dark />
              <div className="flex-1">
                <div className="text-xs text-subtle">Ops agent</div>
                <div className="mt-1 rounded-lg border border-border bg-black p-3 text-sm leading-relaxed text-muted">
                  On it. Pulling the outage feed, crew updates and restoration estimates.
                  <div className="mt-3 space-y-1 font-mono text-[12px]">
                    <div className="text-success">✓ index.html · status.json · styles.css · map.svg</div>
                    <div className="text-success">✓ Page ready at 4:52pm. Six minutes.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
        <Panel title="What the agent built" badge="ready">
          <StatusPreview compact />
        </Panel>
      </div>
      <p className="mt-6 text-sm text-muted">
        Building the page took six minutes. The question is how long it takes to get it in front of customers.
      </p>
    </div>
  );
}

/* Step 2 ------------------------------------------------------------- */

function WallStep() {
  const [shown, setShown] = useState(0);
  const run = useRef(0);

  const play = useCallback(async () => {
    run.current += 1;
    const id = run.current;
    setShown(0);
    for (let i = 1; i <= BEFORE_TIMELINE.length; i++) {
      await sleep(i === 1 ? 250 : 650);
      if (run.current !== id) return;
      setShown(i);
    }
  }, []);

  useEffect(() => {
    play();
    const r = run;
    return () => void (r.current += 1);
  }, [play]);

  const progress = shown / BEFORE_TIMELINE.length;
  const callsSoFar = Math.round(callsInGap * Math.max(0, (shown - 2) / (BEFORE_TIMELINE.length - 2)));

  return (
    <div>
      <Eyebrow>How it goes today</Eyebrow>
      <Title
        sub={
          <>
            The agent finishes the page in six minutes, then hits a sign-up form. Sign-up sends a verification email.
            An agent can&apos;t click that link, so the work stops and waits for a human, a ticket, and an approval.
          </>
        }
      >
        The page is ready. The account wall isn&apos;t.
      </Title>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Before: Saturday evening"
          right={
            <button onClick={play} className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted hover:text-foreground">
              Replay
            </button>
          }
        >
          <Timeline rows={BEFORE_TIMELINE} shown={shown} />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title="Sign-up wall" badge="agent blocked">
            <div className="rounded-lg border border-border bg-black p-4">
              <div className="text-sm font-medium">Verify your email</div>
              <div className="mt-1 text-xs text-muted">We sent a link to ops-agent@quollridge… Click it to continue.</div>
              <div className="mt-3 h-8 rounded-md border border-dashed border-danger/50 bg-danger/[0.06] text-center text-[11px] leading-8 text-danger">
                Waiting for a click that never comes
              </div>
            </div>
          </Panel>
          <Panel title="Meanwhile, at the call centre">
            <div className="font-mono text-4xl font-semibold tabular-nums text-warn">{fmtInt(callsSoFar)}</div>
            <div className="mt-1 text-xs text-muted">calls asking “when is my power back?” while the page sits in a queue</div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-card-2">
              <div className="h-full bg-warn transition-all duration-500" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10.5px] text-subtle">
              <span>4:52pm page ready</span>
              <span>9:04pm live</span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* Step 3 ------------------------------------------------------------- */

function DropStep({ deploy, onDeploy, onLive }: { deploy: DeployPhase; onDeploy: () => void; onLive: () => void }) {
  const [over, setOver] = useState(false);
  const [secs, setSecs] = useState(deploy === "live" ? DEPLOY_SECONDS : 0);
  const [log, setLog] = useState<string[]>(deploy === "live" ? DEPLOY_LOG : []);
  const started = useRef(false);

  const start = useCallback(async () => {
    if (started.current || deploy !== "idle") return;
    started.current = true;
    onDeploy();
    const lines = DEPLOY_LOG;
    const total = 3200;
    const t0 = performance.now();
    const tick = setInterval(() => {
      const f = Math.min(1, (performance.now() - t0) / total);
      setSecs(Math.round(f * DEPLOY_SECONDS));
    }, 50);
    for (let i = 0; i < lines.length; i++) {
      await sleep(total / lines.length);
      setLog((l) => [...l, lines[i]]);
    }
    clearInterval(tick);
    setSecs(DEPLOY_SECONDS);
    onLive();
  }, [deploy, onDeploy, onLive]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    start();
  };

  const isLive = deploy === "live";

  return (
    <div>
      <Eyebrow>With Vercel Drop</Eyebrow>
      <Title
        sub={
          <>
            Same agent, same page. This time it drops the folder on Vercel. No account, no verification email, no
            ticket. A live URL comes straight back.
          </>
        }
      >
        Drag a folder. Get a live URL.
      </Title>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Agent's output" badge="built 4:52pm">
          <div
            draggable={!isLive && deploy === "idle"}
            onDragStart={(e) => e.dataTransfer.setData("text/plain", PAGE_FOLDER)}
            className={`rounded-lg border bg-card-2 p-4 transition ${
              deploy === "idle" ? "cursor-grab border-white/30 hover:border-white active:cursor-grabbing" : "border-border opacity-50"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <FolderIcon /> {PAGE_FOLDER}
            </div>
            <ul className="mt-3 space-y-1 font-mono text-[12px] text-muted">
              {PAGE_FILES.map((f) => (
                <li key={f.name} className="flex justify-between">
                  <span>{f.name}</span>
                  <span className="text-subtle">{f.size}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs text-subtle">
            {deploy === "idle" ? "Drag this folder onto the drop zone, or click the zone." : "Dropped."}
          </p>
        </Panel>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          onClick={start}
          role="button"
          tabIndex={0}
          className={`relative flex min-h-[300px] flex-col rounded-xl border-2 border-dashed p-6 transition ${
            isLive
              ? "cursor-default border-success/50 bg-success/[0.04]"
              : over
                ? "cursor-copy border-white bg-white/[0.06]"
                : deploy === "uploading"
                  ? "border-blue/60 bg-blue/[0.04]"
                  : "cursor-pointer border-white/25 bg-card hover:border-white/60"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <VercelMark className="h-3.5 w-3.5" /> vercel.com/drop
            </div>
            <div className="font-mono text-xs tabular-nums text-muted">{deploy === "idle" ? "0s" : `${secs}s`}</div>
          </div>

          {deploy === "idle" && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border">
                <UploadIcon />
              </div>
              <div className="mt-4 text-lg font-medium">Drop a file, folder, or ZIP</div>
              <div className="mt-1 text-sm text-muted">No account needed. You get a live URL.</div>
            </div>
          )}

          {deploy !== "idle" && (
            <div className="flex flex-1 flex-col">
              <div className="space-y-1.5 font-mono text-[12.5px]">
                {log.map((l, i) => (
                  <div key={i} className="row-in flex items-center gap-2 text-muted">
                    <span className="text-success">✓</span> {l}
                  </div>
                ))}
                {deploy === "uploading" && (
                  <div className="flex items-center gap-2 text-blue">
                    <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-blue" /> working
                  </div>
                )}
              </div>
              {isLive && (
                <div className="row-in mt-5 rounded-lg border border-success/40 bg-black p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-success" />
                      <span className="text-sm font-medium">Live</span>
                      <span className="font-mono text-[11px] text-subtle">in {DEPLOY_SECONDS} seconds</span>
                    </div>
                    <span className="rounded-full border border-warn/50 px-2 py-0.5 text-[11px] text-warn">
                      Claim within 1 hour to keep it
                    </span>
                  </div>
                  <div className="mt-3 rounded-md border border-border bg-card-2 px-3 py-2 font-mono text-sm">
                    https://{LIVE_HOST}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isLive && (
        <p className="row-in mt-6 text-sm text-muted">
          4:52pm. The page is live while the storm is still on the evening news. Under the old process, it went live at
          9:04pm.
        </p>
      )}
    </div>
  );
}

/* Step 4 ------------------------------------------------------------- */

function ShareStep({ live, onGoDrop }: { live: boolean; onGoDrop: () => void }) {
  return (
    <div>
      <Eyebrow>4:55pm · the link goes out</Eyebrow>
      <Title
        sub={
          <>
            Priya texts the link to every affected customer, pins it on the website and puts it on the phone line.
            Customers get their answer on their phone instead of in a call queue.
          </>
        }
      >
        Customers have answers in minutes, not hours.
      </Title>
      {!live && <NeedsDrop onGoDrop={onGoDrop} />}
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="mx-auto w-full max-w-[300px] rounded-[2rem] border border-border bg-black p-3">
          <div className="rounded-[1.5rem] bg-card-2 p-4">
            <div className="text-center text-[11px] text-subtle">Quollridge · SMS · 4:55pm</div>
            <div className="mt-3 rounded-2xl rounded-tl-sm bg-[#1f1f1f] p-3 text-[13px] leading-relaxed">
              Quollridge Energy: we know your power is out. Live updates on crews and restoration times for your
              suburb: <span className="text-blue underline">{LIVE_HOST}</span>
            </div>
            <div className="mt-3">
              <StatusPreview compact />
            </div>
          </div>
        </div>
        <Panel title="Call centre, first hours of the storm" badge="simulated">
          <CallsChart />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <div className="text-[11px] text-subtle">Before (page live 9:04pm)</div>
              <div className="mt-1 font-mono text-2xl tabular-nums text-warn">{fmtInt(callsInGap)}</div>
              <div className="text-[11px] text-muted">calls with no page to point to</div>
            </div>
            <div className="rounded-lg border border-success/40 p-3">
              <div className="text-[11px] text-subtle">With Vercel Drop (live 4:52pm)</div>
              <div className="mt-1 font-mono text-2xl tabular-nums text-success">−{fmtInt(callsAvoided)}</div>
              <div className="text-[11px] text-muted">calls answered by the page instead</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* Step 5 ------------------------------------------------------------- */

function ClaimStep({
  live,
  deployedAt,
  claimed,
  fastForward,
  onClaim,
  onFastForward,
  onGoDrop,
}: {
  live: boolean;
  deployedAt: number | null;
  claimed: boolean;
  fastForward: boolean;
  onClaim: () => void;
  onFastForward: () => void;
  onGoDrop: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [modal, setModal] = useState<null | "signin" | "team" | "done">(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = deployedAt ? (now - deployedAt) / 1000 : 0;
  const liveLeft = fastForward ? 0 : 3600 - DEPLOY_SECONDS - elapsed;
  const draftLeft = fastForward ? 0 : 3600 - 95 - elapsed;

  return (
    <div>
      <Eyebrow>Within the hour · deploy first, identity later</Eyebrow>
      <Title
        sub={
          <>
            The page went live without an account. Now Priya signs in and claims it into {COMPANY}&apos;s Vercel team,
            so it stays live under the company&apos;s own governance. Anything nobody claims cleans itself up.
          </>
        }
      >
        Claim what matters. The rest expires on its own.
      </Title>
      {!live && <NeedsDrop onGoDrop={onGoDrop} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <DeploymentCard
          name="outage-status"
          host={LIVE_HOST}
          caption="The page customers are using"
          state={claimed ? "claimed" : liveLeft <= 0 ? "expired" : "temporary"}
          left={liveLeft}
          action={
            !claimed && liveLeft > 0 ? (
              <button
                onClick={() => setModal("signin")}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-white/85"
              >
                Sign in and claim
              </button>
            ) : null
          }
        />
        <DeploymentCard
          name="outage-map-draft"
          host={DRAFT_HOST}
          caption="An earlier draft the agent tried. Nobody needs it."
          state={draftLeft <= 0 ? "expired" : "temporary"}
          left={draftLeft}
          action={
            !fastForward ? (
              <button
                onClick={onFastForward}
                disabled={!claimed}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
                title={claimed ? "" : "Claim the live page first"}
              >
                Skip ahead one hour →
              </button>
            ) : null
          }
        />
      </div>

      {claimed && (
        <div className="row-in mt-5 rounded-xl border border-border bg-card p-4 text-sm text-muted">
          <span className="text-foreground">5:31pm.</span> The status page now lives in the{" "}
          <span className="text-foreground">Quollridge Ops</span> team: the company&apos;s access, domains and audit trail,
          same URL, still live.
          {fastForward ? (
            <>
              {" "}
              <span className="text-foreground">5:53pm.</span> The unclaimed draft has expired. No orphaned URLs left
              lying around after the storm.
            </>
          ) : null}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="fade-in w-full max-w-sm rounded-xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <VercelMark className="h-4 w-4" />
              <span className="text-sm font-medium">Claim your project</span>
            </div>
            {modal === "signin" && (
              <div className="mt-5">
                <div className="text-xs text-subtle">Signed in with company SSO</div>
                <div className="mt-2 rounded-md border border-border bg-black px-3 py-2 text-sm">priya.nair@quollridge.example</div>
                <button
                  onClick={() => setModal("team")}
                  className="mt-4 w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-white/85"
                >
                  Continue
                </button>
              </div>
            )}
            {modal === "team" && (
              <div className="mt-5">
                <div className="text-xs text-subtle">Choose a team for outage-status</div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-white bg-black px-3 py-2 text-sm">
                    <span>Quollridge Ops</span>
                    <span className="text-[11px] text-subtle">Enterprise</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-muted">
                    <span>Priya Nair (personal)</span>
                    <span className="text-[11px] text-subtle">Hobby</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClaim();
                    setModal("done");
                  }}
                  className="mt-4 w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-white/85"
                >
                  Claim into Quollridge Ops
                </button>
              </div>
            )}
            {modal === "done" && (
              <div className="mt-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">✓</div>
                <div className="mt-3 text-sm font-medium">Claimed. It stays live.</div>
                <div className="mt-1 text-xs text-muted">outage-status is now a Quollridge Ops project.</div>
                <button
                  onClick={() => setModal(null)}
                  className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm hover:border-white/40"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DeploymentCard({
  name,
  host,
  caption,
  state,
  left,
  action,
}: {
  name: string;
  host: string;
  caption: string;
  state: "temporary" | "claimed" | "expired";
  left: number;
  action: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(1, left / 3600));
  return (
    <div
      className={`rounded-xl border p-5 transition ${
        state === "claimed" ? "border-success/50 bg-success/[0.04]" : state === "expired" ? "border-border bg-card opacity-60" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{name}</div>
          <div className={`mt-0.5 font-mono text-[12px] ${state === "expired" ? "text-subtle line-through" : "text-muted"}`}>{host}</div>
          <div className="mt-1 text-xs text-subtle">{caption}</div>
        </div>
        <StateChip state={state} />
      </div>

      <div className="mt-5">
        {state === "temporary" && (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted">Time left to claim</span>
              <span className="font-mono text-3xl font-semibold tabular-nums">{mmss(left)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card-2">
              <div className="h-full bg-warn transition-all duration-1000" style={{ width: `${pct * 100}%` }} />
            </div>
          </>
        )}
        {state === "claimed" && (
          <div className="text-sm text-success">Owned by Quollridge Ops · stays live · no expiry</div>
        )}
        {state === "expired" && <div className="text-sm text-muted">Expired after one hour unclaimed. URL removed, nothing to clean up.</div>}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function StateChip({ state }: { state: "temporary" | "claimed" | "expired" }) {
  const map = {
    temporary: "border-warn/50 text-warn",
    claimed: "border-success/50 text-success",
    expired: "border-border text-subtle",
  } as const;
  const label = { temporary: "Temporary", claimed: "Claimed", expired: "Expired" }[state];
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${map[state]}`}>{label}</span>;
}

/* Step 6 ------------------------------------------------------------- */

function ValueStep() {
  return (
    <div>
      <Eyebrow>One storm · {COMPANY}</Eyebrow>
      <Title
        sub={
          <>
            The agent was always fast. The account wall was the slow part. Take it away and the work an agent finishes
            reaches customers straight away, then lands in the company&apos;s team once someone signs in.
          </>
        }
      >
        From finished to live in 38 seconds.
      </Title>

      <Panel title="Time from page ready to live URL" badge="simulated">
        <div className="space-y-4">
          <Bar label="Before: sign-up, ticket, approval" value="4h 12m" pct={1} tone="bg-danger" />
          <Bar label="With Vercel Drop" value={`${DEPLOY_SECONDS}s`} pct={0.006} tone="bg-success" />
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Time to live URL" value={`${DEPLOY_SECONDS} sec`} sub="was 4h 12m" tone="success" />
        <Stat label="Hours sooner for customers" value={hoursFaster.toFixed(1)} sub={`plus ${STAFF_HOURS_SAVED} staff hours not spent chasing access`} />
        <Stat
          label="Call-centre calls avoided"
          value={fmtInt(callsAvoided)}
          sub={`${Math.round(DEFLECTION * 100)}% of ${fmtInt(callsInGap)} calls answered by the page`}
          tone="success"
        />
        <Stat label="Call cost avoided" value={fmtAud(costAvoided)} sub={`per storm at $${COST_PER_CALL} a call`} />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="text-sm text-muted">Across {STORMS_PER_YEAR} major weather events a year</div>
          <div className="font-mono text-3xl font-semibold tabular-nums">{fmtAud(costAvoidedYear)}</div>
        </div>
        <div className="mt-3 text-xs text-subtle">
          And every throwaway draft an agent makes cleans itself up after an hour unless someone claims it.
        </div>
      </div>
      <p className="mt-6 text-[11px] text-subtle">
        Simulated demo, fictional company. Assumes {fmtInt(CALLS_PER_HOUR)} calls an hour during the outage, {Math.round(DEFLECTION * 100)}% answered
        by a live status page, ${COST_PER_CALL} per handled call.
      </p>
    </div>
  );
}

/* Shared bits -------------------------------------------------------- */

function Timeline({ rows, shown }: { rows: TimelineRow[]; shown: number }) {
  return (
    <ol className="relative space-y-4 pl-5">
      <span className="absolute bottom-1 left-[5px] top-1 w-px bg-border" />
      {rows.map((r, i) => {
        const vis = i < shown;
        const t = TONE[r.tone];
        return (
          <li key={i} className={`relative transition-opacity duration-300 ${vis ? "row-in opacity-100" : "opacity-0"}`}>
            <span className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card ${t.dot}`} />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="w-14 shrink-0 font-mono text-xs text-subtle">{r.at}</span>
              <span className={`flex-1 text-sm ${t.text}`}>{r.text}</span>
              {r.note ? <span className={`rounded-full border px-2 py-0.5 text-[10.5px] ${t.chip}`}>{r.note}</span> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CallsChart() {
  // hourly buckets 5pm-9pm. Before: full volume until 9:04. After: page live from 4:55, volume drops by deflection.
  const hours = ["5pm", "6pm", "7pm", "8pm", "9pm"];
  const before = [1, 1, 1, 1, 0.55];
  const after = before.map((v, i) => (i === 4 ? v * 0.9 : v * (1 - DEFLECTION)));
  return (
    <div>
      <div className="flex h-36 items-end gap-3">
        {hours.map((h, i) => (
          <div key={h} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end gap-1">
              <div className="flex-1 rounded-t bg-warn/70" style={{ height: `${before[i] * 100}%` }} />
              <div className="flex-1 rounded-t bg-success/80" style={{ height: `${after[i] * 100}%` }} />
            </div>
            <span className="font-mono text-[10.5px] text-subtle">{h}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-warn/70" /> Before
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-success/80" /> With Vercel Drop
        </span>
      </div>
    </div>
  );
}

function StatusPreview({ compact = false }: { compact?: boolean }) {
  const rows = [
    { s: "Gosford", n: "4,210", eta: "9:30pm", st: "Crew on site" },
    { s: "Maitland", n: "6,880", eta: "11:00pm", st: "Assessing" },
    { s: "The Entrance", n: "3,140", eta: "8:15pm", st: "Crew on site" },
    { s: "Cessnock", n: "2,560", eta: "Sun 7:00am", st: "Lines down" },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white text-black">
      <div className="flex items-center justify-between bg-black px-3 py-2 text-white">
        <span className="text-[12px] font-semibold">Quollridge Energy · Outage updates</span>
        <span className="flex items-center gap-1 text-[10px]">
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[#ff6166]" /> Live
        </span>
      </div>
      <div className="p-3">
        <div className="text-[11px] text-neutral-500">Updated 4:52pm · {fmtInt(CUSTOMERS_OUT)} customers affected</div>
        <table className={`mt-2 w-full ${compact ? "text-[11px]" : "text-sm"}`}>
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="pb-1 font-normal">Suburb</th>
              <th className="pb-1 font-normal">Homes</th>
              <th className="pb-1 font-normal">Estimate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.s} className="border-t border-neutral-200">
                <td className="py-1 font-medium">{r.s}</td>
                <td className="py-1 tabular-nums">{r.n}</td>
                <td className="py-1">{r.eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NeedsDrop({ onGoDrop }: { onGoDrop: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-warn/40 bg-warn/[0.06] px-4 py-2 text-sm">
      <span className="text-warn">Drop the folder first to get the live URL.</span>
      <button onClick={onGoDrop} className="rounded-md border border-border px-3 py-1 text-xs hover:border-white/40">
        Go to Drop it
      </button>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "success" | "danger" | "warn" }) {
  const c = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${c}`}>{value}</div>
      {sub ? <div className="mt-1 text-[11.5px] text-subtle">{sub}</div> : null}
    </div>
  );
}

function Bar({ label, value, pct, tone }: { label: string; value: string; pct: number; tone: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-card-2">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0.8, pct * 100)}%` }} />
      </div>
    </div>
  );
}

function Avatar({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium ${
        dark ? "border-border bg-black text-foreground" : "border-white bg-white text-black"
      }`}
    >
      {label}
    </div>
  );
}

function FolderIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
