# Kontrollert 30. september 2026

- 46 automatiske tester bestått: vanlig/vektet snitt, planlegging, regler for fagpoeng, duplikater, årsskifte, studiesøk og datavalidering. Nye språkprøver dekker komplett muntlig/skriftlig-par, manglende eller strøket del, gamle bekreftelser, ulike språk/nivå, fellesfag/programfag og 2028.
- Alle 5412 CSV-rader er avstemt mot JSON, inkludert skillet mellom positiv grense, alle kvalifiserte og ikke oppgitt. 1369 unike studier og 27 læresteder.
- I nettleseren: matematikkforslag, valg med Enter, bekreftelsesdialog, bestått karakter, R2-poeng i 2027/2028, ungdomsskole uten fagbonus og bytte tilbake.
- Studiesøk etter medisin i Oslo og valg av studie; førstegangsvitnemål og ordinær kvote viser ulike kildeverdier. Opplysninger om historiske grenser vises.
- Responsiv kontroll ved 320 × 740 og 390 × 844, samt vanlig desktopbredde: ingen horisontal side-overflyt. Fagforslag holdes innenfor skjermen. Headeren beholder fast plassering etter scrolling.
- Resultatfeltet er tilbakeført til flat bakgrunn uten bilde eller glass. Glass er beholdt i headeren. Det er ingen kontinuerlige animasjoner.
- Språkdialog kontrollert i nettleser: bekreftelse er deaktivert før muntlig/skriftlig er valgt; entydig tekst foreslår riktig del. Spansk III muntlig alene ga ingen bonus. Med skriftlig bestått i tillegg ble nivået vist én gang med 1 poeng. «Fransk 2» viste både fellesfag uten poeng og programfag. Endring av fagnavn fjernet gammel bekreftelse.
- Fokusert Matematikk R1 har 8px avstand mellom felt og statustekst; tekst kan brytes på 320px mobil uten at fokusrammen overlapper. Dialogen holdes innenfor mobilbredden og ruller ved behov.
- Eksisterende lagrede fag ble bevart under kontrollen. Begge testfagene ble fjernet etter kontroll. Ingen personlige karakterer ligger i prosjektfilene.

## Hero og header kontrollert 1. oktober 2026

- Heroens intro, støttetekster og tekstknapp er fjernet. Kinetio-ordmerket og pilen til kalkulatoren er beholdt.
- Headeren måler 48px på 1280 × 720 og 320 × 740. Synlige kontroller er 44px høye. Ingen horisontal overflyt ved mobilkontrollen.
- Mer gjennomsiktig glass er kontrollert i lyst og mørkt tema. Headeren står fast ved scrolling, og pilen fører til kalkulatoren.
- Produksjonsbygget fullførte. Nettleseren viste ingen feil. Lagrede fag er ikke endret.

Siden anslår poeng fra oppgitte karakterer; den avgjør ikke opptaksrett, kvote eller hvilke karakterer som skal stå på dokumentasjonen. Se ADMISSION-RULES.md og STUDY-DATA.md.
