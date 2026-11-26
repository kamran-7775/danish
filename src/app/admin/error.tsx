"use client";

/** Friendly error screen for the admin (instead of a blank "This page couldn't load"). */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="login">
      <div className="login__card" style={{ width: "min(100%, 560px)" }}>
        <h1 className="login__title">Admin couldn&apos;t load</h1>
        <p className="adm-hint">This is almost always a missing or wrong setting on Vercel. Open the setup check to see which one:</p>
        <p style={{ margin: "1rem 0" }}>
          <a className="adm-btn" href="/api/health" target="_blank" rel="noopener noreferrer">
            Open setup check (/api/health)
          </a>
        </p>
        <ol className="howto">
          <li>Vercel → Settings → Environment Variables: fix anything marked MISSING / ERROR.</li>
          <li>Deployments → ⋯ → Redeploy (variables only apply to new deployments).</li>
          <li>Reload this page.</li>
        </ol>
        {error.digest && <p className="adm-hint">Error code: {error.digest}</p>}
        <div className="form-actions">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
