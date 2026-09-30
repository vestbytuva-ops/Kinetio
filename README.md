# Kinetio

En karakterkalkulator for ungdomsskole og videregående, med norsk grensesnitt og karakterer fra 1 til 6. Den beregner snitt, anslag på karakter- og fagpoeng og søker i publiserte poenggrenser fra Samordna opptak. Den fastsetter ikke standpunktkarakterer eller endelige opptakspoeng.

[Åpne Kinetio](https://kinetio.vestby-tuva.workers.dev/) · [Kildekode på GitHub](https://github.com/vestbytuva-ops/Kinetio)

## Start

Åpne denne mappen i en terminal med Node.js 24 og npm installert:

```sh
npm ci
npm run dev
```

Åpne [localhost:5173](http://localhost:5173). Avslutt med `Ctrl+C`.

```sh
npm test       # Kontroller beregningene
npm run build # Lag produksjonsfiler i dist/
```

## Bruk

- Endre eksempelkarakterene eller velg «Start på nytt».
- Legg til og fjern fag, og angre siste fjerning.
- Se vanlig eller vektet snitt og karakterfordeling.
- Bruk «Hva hvis?» for å prøve neste karakter eller beregne hva et ønsket snitt krever.
- Bytt mellom lyst og mørkt tema.
- Velg ungdomsskole eller videregående og opptaksår 2026, 2027 eller 2028.
- Skriv fagnavn, velg et forslag og bekreft fagtype/nivå før realfags- eller språkpoeng tas med. Samme fag gir ikke flere tillegg selv om standpunkt og eksamen er ført hver for seg.
- For fremmedspråk som programfag bekreftes muntlig og skriftlig på hver sin rad. Begge må være registrert og bestått på samme nivå. I 2026/2027 gir nivå I/II 0,5 og III 1 poeng samlet; fellesfag gir ingen språkpoeng. Fra 2028 faller språkpoeng bort.
- Se forklaringer for førstegangsvitnemål og ordinær kvote i resultatfeltet.
- Søk etter studium, lærested, sted eller studiekode. Kvoter og opptaksrunder vises hver for seg. CSV-filen kan lastes ned fra siden.

Se [ADMISSION-RULES.md](ADMISSION-RULES.md) for regler, kilder og avgrensninger. Språk- og realfagspoeng endres fra 2028. Enkelte kombinasjoner krever vurdering og gir derfor ingen samlet poengsum før de er avklart.

Studiesøket bruker 1369 studier fra 27 læresteder i Samordna opptaks 2026-rapport. Det omfatter ikke lokale opptak. Uttrekk, kontrollsummer og oppdatering er dokumentert i [STUDY-DATA.md](STUDY-DATA.md). `npm test` kontrollerer både beregningene og samtlige 5412 rader mot original CSV.

Fag, karakterer og tema lagres automatisk i nettleserens lokale lagring på denne enheten. Ingen innlogging kreves, og karakterene sendes ikke til en server. Hvis nettleseren blokkerer lagring, varer dataene bare mens siden er åpen. Bruk «Start på nytt» på delte enheter.

## Publisering

Nettsiden er publisert som statiske filer på Cloudflare Workers, under `kinetio`. Den trenger ingen backend eller hemmelige miljøvariabler. Kildekoden ligger på `main` i GitHub-repositoriet.

Oppdateringer publiseres foreløpig manuelt: kjør `npm ci`, `npm test` og `npm run build` med Node.js 24. Åpne Kinetio i Cloudflare → **New deployment**, og last opp mappen `dist`. Kun innholdet i `dist` skal publiseres, med `/` som assets directory. GitHub-opplasting alene oppdaterer ikke nettsiden automatisk.

Utviklingskommandoen starter bare en lokal forhåndsvisning. Karakterer lagret på localhost følger ikke automatisk med til en ny nettadresse, siden nettleserlagring er knyttet til hvert nettsted.

## Design og referanser

- Brukerens Kinetio-bilde: fargepalett, stor typografi og kornet overflate.
- [Realevate Evergreen](https://realevate.agency/evergreen): redaksjonelt uttrykk og rolige bevegelser ved scrolling.
- [In View av ibelick på 21st.dev](https://21st.dev/@ibelick/components/in-view): inspirasjon til en uavhengig implementering av inn-animasjoner.
- [Radix UI](https://www.radix-ui.com/) og [Motion](https://motion.dev/): interaktive kontroller og animasjoner.

Heroen bruker et originalt malt landskap i `public/kinetio-meadow-hero.png`, generert med innebygd imagegen. Se [hero-art-direction.md](hero-art-direction.md) for full prompt og opphav. Den tidligere kornteksturen beholdes i `public/kinetio-grain.png`. Headeren står fast over siden med en statisk glasseffekt og har et ugjennomsiktig alternativ ved redusert transparens. Kalkulatorens tidligere flate oppsett er bevart, med stort snitt og karakterfordeling øverst. Sidens oliven- og salvietoner, fargesirkler og karakterfelt følger landskapets palett.

De vedlagte Spotlight- og Prisma-komponentene er brukt som inspirasjon, tilpasset prosjektets React/JavaScript, Motion, Radix og Phosphor-oppsett. Søk bruker `cmdk` for tastaturstyring. Ingen videoer eller kontinuerlige animasjoner er lagt inn; bevegelse er korte overganger og respekterer redusert bevegelse.

Footerens innsjøillustrasjon i `public/kinetio-lake-footer.png` er også generert spesielt til Kinetio, inspirert av brukerens landskapsreferanse. Bildet er statisk og lastes ved behov. Ordmerke og lenker er vanlig HTML. Se [footer-art-direction.md](footer-art-direction.md) for prompt og opphav.
