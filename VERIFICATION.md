# Kontrollert 30. september 2026

- 46 automatiske tester bestått: vanlig/vektet snitt, planlegging, regler for fagpoeng, duplikater, årsskifte, studiesøk og datavalidering. Nye språkprøver dekker komplett muntlig/skriftlig-par, manglende eller strøket del, gamle bekreftelser, ulike språk/nivå, fellesfag/programfag og 2028.
- Alle 5412 CSV-rader er avstemt mot JSON, inkludert skillet mellom positiv grense, alle kvalifiserte og ikke oppgitt. 1369 unike studier og 27 læresteder.
- I nettleseren: matematikkforslag, valg med Enter, bekreftelsesdialog, bestått karakter, R2-poeng i 2027/2028, ungdomsskole uten fagbonus og bytte tilbake.
- Studiesøk etter medisin i Oslo og valg av studie; førstegangsvitnemål og ordinær kvote viser ulike kildeverdier. Opplysninger om historiske grenser vises.
- Responsiv kontroll ved 320 × 740 og 390 × 844, samt vanlig desktopbredde: ingen horisontal side-overflyt. Fagforslag holdes innenfor skjermen. Headeren beholder fast plassering etter scrolling.
- Resultatfeltet er tilbakeført til flat bakgrunn uten bilde eller glass. Glass er beholdt i headeren. Det er ingen kontinuerlige animasjoner.
- Språkdialog kontrollert i nettleser: bekreftelse er deaktivert før muntlig/skriftlig er valgt; entydig tekst foreslår riktig del. Spansk III muntlig alene ga ingen bonus. Med skriftlig bestått i tillegg ble nivået vist én gang med 1 poeng. «Fransk 2» viste både fellesfag uten poeng og programfag. Endring av fagnavn fjernet gammel bekreftelse.
- Fokusert Matematikk R1 har 8px avstand mellom felt og statustekst; tekst kan brytes på 320px mobil uten at fokusrammen overlapper. Dialogen holdes innenfor mobilbredden og ruller ved behov.
- Hero-teksten og knappen er flyttet ned rundt midten, nærmere logoen. Kontrollert på 320 × 740, 1440 × 900 og brukerens kompakte desktopvisning. Ingen overlapp mellom tekstgruppen og logoen.
- Eksisterende lagrede fag ble bevart under kontrollen. Begge testfagene ble fjernet etter kontroll. Ingen personlige karakterer ligger i prosjektfilene.
- Ekstra grensekontroll: 1920 × 821 ga ca. 31px klaring mellom tekstgruppe og logo; 600 × 360 ga ca. 25px og ingen horisontal overflyt. Produksjonsbygget fullførte, og sluttkontrollen viste ingen nettleserfeil.

Siden anslår poeng fra oppgitte karakterer; den avgjør ikke opptaksrett, kvote eller hvilke karakterer som skal stå på dokumentasjonen. Se ADMISSION-RULES.md og STUDY-DATA.md.
