"use client";

/** Small client pieces for admin forms: pending-aware submit, confirm-before-delete, hue slider. */
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "adm-btn" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

/** A one-button form that asks for confirmation first (used for Delete). */
export function ConfirmForm({
  action,
  id,
  message,
  children,
  className = "adm-btn adm-btn--danger adm-btn--sm",
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form action={action} onSubmit={(e) => !window.confirm(message) && e.preventDefault()}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

/** Hue slider with a live colour swatch (the clip colour on the timeline). */
export function HueField({ defaultValue = 0 }: { defaultValue?: number }) {
  const [hue, setHue] = useState(defaultValue);
  return (
    <div className="adm-field">
      <label className="adm-label" htmlFor="hue">
        Timeline colour
      </label>
      <div className="hue">
        <input id="hue" name="hue" type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} />
        <span className="hue__swatch" style={{ background: `hsl(${hue} 55% 38%)` }}>
          {hue}°
        </span>
      </div>
    </div>
  );
}
