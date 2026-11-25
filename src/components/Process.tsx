import type { CSSProperties } from "react";
import { portfolio } from "@/data/portfolio";
import { Sparkle } from "./Icons";

/**
 * Process as an export "Render Queue": when the window scrolls into view, each step
 * renders one after another (progress bar fills, status flips from Queued to Done).
 * Pure CSS timing (see .queue in globals.css); everything is readable without JS.
 */
export default function Process() {
  const steps = portfolio.process;
  return (
    <section className="process paper" id="process" aria-labelledby="process-title">
      <div className="container process__layout">
        <div>
          <h2 className="process__title" id="process-title" data-reveal>
            Process <Sparkle />
          </h2>
          <p className="caps process__lead" data-reveal>
            From the first call to the final export: a simple, transparent workflow, so you always know what&apos;s happening and when.
          </p>
        </div>

        <div className="queue" data-reveal>
          <div className="queue__bar">
            <span className="suite__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>Render Queue</span>
            <span className="queue__count">{steps.length} items</span>
          </div>
          <div className="queue__cols" aria-hidden="true">
            <span>#</span>
            <span>Item</span>
            <span>Status</span>
          </div>
          <ol className="queue__list">
            {steps.map((s, i) => (
              <li key={s.title} className="job" style={{ "--n": i } as CSSProperties}>
                <span className="job__num">0{i + 1}</span>
                <div className="job__main">
                  <h3 className="job__title">{s.title}</h3>
                  <p className="job__desc">{s.description}</p>
                  <span className="job__bar" aria-hidden="true">
                    <i />
                  </span>
                </div>
                <span className="job__status">
                  <span className="job__queued" aria-hidden="true">
                    Queued
                  </span>
                  <span className="job__done">✓ Done</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="queue__foot" aria-hidden="true">
            <span>Output: H.264 · 4K · 25 fps</span>
            <span className="queue__ready">Ready to deliver</span>
          </div>
        </div>
      </div>
    </section>
  );
}
