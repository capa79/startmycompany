# Start my company

AI-app som hjelper gründere å starte selskap i Norge, Sverige, Danmark, Estland, Polen, Sveits, UAE, Filippinene og Storbritannia.
Next.js 16 + Postgres, bygget på samme oppsett som Nextly.

- `/` – forside med oversikt over landene
- `/registrer`, `/login` – konto med e-post og passord, eller «Fortsett med Google»
- `/app` – mine selskaper (saker)
- `/app/ny` – AI-intervju: virksomhet, bosted og e-ID, eiere og kunder, skatt/regnskap/rapportering, bank og visum, kapital
- `/app/sak/[id]` – sammenligning av alle 9 land med poeng, begrunnelser og AI-rådgiverens vurdering
- `/app/sak/[id]/plan` – steg-for-steg-plan, krav, bank, visum, rapportering og kilder for valgt land
- `/app/sak/[id]/dokumenter` – stiftelsesdokument, vedtekter og aksjeeierbok for norsk AS (utskrift / PDF)
- `/app/konto` – navn, passord og sletting av konto
- `/admin` – brukere, saker, valgte land, AI-bruk og logg (bare administratorer)
- Språk (norsk/engelsk) og valuta (NOK, SEK, DKK, EUR, GBP, CHF, PLN, USD, AED, PHP) velges hver for seg i toppmenyen,
  huskes i nettleseren og på kontoen

## Valuta
Beløp lagres i landets egen valuta (`startCost` i `lib/countries.ts`) og omregnes til brukerens valuta med
Norges Banks middelkurser (`lib/rates.ts`, hentes på nytt hver 6. time). Svarer ikke Norges Bank, brukes
reservekursene i `lib/currency.ts`, og siden sier fra om det. Beløp i samme valuta som landet vises eksakt,
omregnede beløp rundes av og merkes «ca.». Dokumentene for norsk AS er alltid i NOK.

## Miljøvariabler (Render → Environment)
| Navn | Beskrivelse |
|---|---|
| `DATABASE_URL` | Postgres. Neon: «pooled connection string» med `sslmode=require` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Hovedadministrator, opprettes ved oppstart (passord minst 10 tegn) |
| `APP_URL` | Offentlig adresse uten `/` til slutt, f.eks. `https://startmycompany.onrender.com` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Valgfri. «Fortsett med Google». Omdirigerings-URI: `{APP_URL}/api/auth/google/callback` |
| `ANTHROPIC_API_KEY` | Valgfri. AI-rådgiveren (Claude). `SMC_AI_MODEL` og `SMC_AI_DAILY_CAP` kan overstyre modell og døgngrense |
| `LEGAL_ENTITY` / `LEGAL_ORGNR` / `PRIVACY_CONTACT` | Vises i personvernerklæringen |

Tabellene opprettes automatisk første gang appen kobler til databasen.

## Publisere på Render
1. Lag en database i Neon og kopier «pooled connection string».
2. Render → New → Blueprint → velg repoet. `render.yaml` setter opp tjenesten.
3. Fyll inn miljøvariablene over. Hver push til `main` publiseres automatisk.

## Landsdata
All fakta om land, gebyrer og skatt ligger i `lib/countries.ts`, med kilde per land og dato for siste kontroll (`CHECKED`).
Anbefalingene i `lib/recommend.ts` bygger bare på disse dataene. Gebyrer og satser endres hvert år – kontroller dem
og oppdater `CHECKED` minst én gang i året. Punkter merket «må bekreftes» bør sjekkes av lokal advokat før lansering.

## Personvern og sikkerhet
- Passord lagres som scrypt (N=2^15, r=8, p=1), sesjoner som SHA-256-hash, innlogging huskes i 30 dager.
- Etter 8 feil på samme e-post eller 30 fra samme IP stenges innlogging i 15 minutter.
- Fødselsnummer lagres aldri; feltet står tomt i dokumentene og fylles inn for hånd.
- AI-kall registreres med bruker, funksjon og antall tokens, aldri innhold.

## Viktig om regulering
Å opprette selskaper for andre som næring kan kreve autorisasjon fra Finanstilsynet (hvitvaskingsloven § 2 bokstav j).
Appen er laget som selvbetjent veileder og dokumentgenerator. Avklar med Finanstilsynet før fullservice tilbys.

## Lokalt
```
npm install
cp .env.example .env.local   # fyll inn verdiene
npm run dev
```
