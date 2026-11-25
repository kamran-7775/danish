"use client";

/**
 * Contact: big headline + links on grid paper, form on a taped kraft-paper sheet.
 * With contact.formEndpoint set (e.g. Formspree) the form POSTs JSON there;
 * otherwise it opens the visitor's email app with the message prefilled.
 */
import { useEffect, useState, type FormEvent } from "react";
import { portfolio } from "@/data/portfolio";
import Band from "./Band";
import { Starburst } from "./Icons";

type Status = "idle" | "sending" | "sent" | "error";

/** Live clock in your timezone (person.timezone). Hidden if no timezone is set. */
function LocalTime() {
  const { timezone, location } = portfolio.person;
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    if (!timezone) return;
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: timezone });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timezone]);
  if (!timezone || !now) return null;
  return (
    <span className="local-time">
      {location} · <span className="local-time__clock">{now}</span>
    </span>
  );
}

export default function Contact() {
  const { contact, socials, bands } = portfolio;
  const [status, setStatus] = useState<Status>("idle");
  const whatsappHref = `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    if (!contact.formEndpoint) {
      const subject = `New project: ${data.projectType} (${data.name})`;
      const body = `${data.message}\n\n${data.name}\n${data.email}`;
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus("sent");
      return;
    }
    try {
      setStatus("sending");
      const res = await fetch(contact.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <Band text={bands.contact} font="western" variant="red" />
      <div className="contact__stage paper">
        <div className="container contact__grid">
          <div>
            <div className="contact__status" data-reveal>
              <span className="status-pill">
                <span className="status-pill__dot" aria-hidden="true" />
                {portfolio.person.availability}
              </span>
              <LocalTime />
            </div>
            <h2 className="contact__title" id="contact-title" data-reveal>
              Let&apos;s make
              <br />
              something <span className="accent">great</span>
              <Starburst className="contact__burst" />
            </h2>
            <p className="caps contact__lead" data-reveal>
              Got a project, a deadline or just raw footage and an idea? Tell me about it. I usually reply within 24 hours.
            </p>
            <div className="contact__ctas" data-reveal>
              <a href={`mailto:${contact.email}`} className="btn btn--red" data-magnetic>
                Hire me →
              </a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn--outline" data-magnetic>
                WhatsApp
              </a>
            </div>
            <a href={`mailto:${contact.email}`} className="contact__email" data-reveal>
              {contact.email}
            </a>
            <ul className="socials" data-reveal aria-label="Social links">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <form className="form" onSubmit={onSubmit} data-reveal>
            <span className="form__tape" aria-hidden="true" />
            <div className="form__row">
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" type="text" autoComplete="name" required placeholder="Your name" />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@email.com" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="projectType">Project type</label>
              <select id="projectType" name="projectType" required defaultValue="">
                <option value="" disabled>
                  Select a project type
                </option>
                {contact.projectTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" required rows={5} placeholder="Tell me about your project, timeline and budget…" />
            </div>
            <button type="submit" className="btn btn--ink btn--block" disabled={status === "sending"} data-magnetic>
              {status === "sending" ? "Sending…" : "Send message →"}
            </button>
            <p className={`form__status form__status--${status}`} role="status" aria-live="polite">
              {status === "sent" && "Thanks! Your message is on its way."}
              {status === "error" && `Something went wrong. Please email me at ${contact.email}.`}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
