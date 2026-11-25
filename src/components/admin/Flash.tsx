/** Success / error message passed back in the URL (?msg= / ?error=) after an action. */
export default function Flash({ msg, error }: { msg?: string; error?: string }) {
  if (error) return <p className="flash flash--error" role="alert">{error}</p>;
  if (msg) return <p className="flash" role="status">✓ {msg}</p>;
  return null;
}

export type Search = Promise<{ msg?: string; error?: string; category?: string }>;
