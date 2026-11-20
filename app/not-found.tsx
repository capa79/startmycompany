import Link from "next/link";
import { Shell } from "./chrome";
import { getLang, tr } from "@/lib/i18n";

export default async function NotFound() {
  const lang = await getLang();
  return (
    <Shell>
      <div className="stack" style={{ alignItems: "flex-start" }}>
        <h1>{tr(lang, { nb: "Fant ikke siden", en: "Page not found" })}</h1>
        <Link className="btn" href="/">
          {tr(lang, { nb: "Til forsiden", en: "Go to the front page" })}
        </Link>
      </div>
    </Shell>
  );
}
