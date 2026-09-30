# Fagpoeng i Kinetio

Kontrollert 30. september 2026. Dette er et anslag for brukerens innlagte, norske vitnemålskarakterer, ikke en opptaksavgjørelse. Løsningen avgjør ikke generell studiekompetanse, særkrav eller kvotetilhørighet, og beregner ikke alle konkurransepoeng. Karakterer må legges inn fra riktig dokumentasjon; forbedringer erstatter tidligere tellende karakterer.

## Implementert

- Fag gjenkjennes bare som forslag. Brukeren bekrefter fag, nivå og programfag før poeng tas med. Ubekreftet fritekst gir ingen fagpoeng. Ungdomsskole gir aldri VGS-fagpoeng.
- Flere karakterer i samme bekreftede fag gir én fagbonus. Standpunkt og eksamen kan fortsatt være separate tellende karakterer i snittet. Hvis en bekreftet karakter mangler eller er under 2, holdes faget utenfor bonusanslaget. Dette er en konservativ kontroll, ikke en fullstendig vurdering av vitnemålets gyldighet.
- Fremmedspråk som programfag gir 0,5 poeng på nivå I/II og 1 poeng på nivå III i 2026/2027. Fellesfag gir 0; søk etter for eksempel «Fransk 2» viser begge fagtypene. Muntlig og skriftlig må bekreftes på hver sin rad i samme språk og nivå før programfaget får bonus. Begge karakterer tas med i snittet, men bonusen telles bare én gang for hele faget. En enkelt del gir ikke halve bonusen. Denne kontrollen gjelder moderne fremmedspråk (PSP01-04), ikke klassiske språk Latin/Gresk.
- Tidligere lagrede språkbekreftelser uten angitt muntlig/skriftlig beholder karakterene, men må bekreftes på nytt før bonusen tas med. Fritekst alene bekrefter aldri en del. Fra 2028 vises ingen oppfordring om å fullføre språk for bonus, siden språkpoengene da faller bort.
- I 2026 og 2027 brukes maksimalt 4 samlede realfags- og språkpoeng. Matematikk begrenses til 1,5, også ved kombinasjoner av R- og S-fag. Fellesfag, engelsk, skandinaviske språk og 84-timers X-fag gir ikke bonus. Studieforberedende Vg3 naturbruk krever at hele løpet er bekreftet fullført.
- I 2028 halveres realfagssatsene og taket er 2. Språk- og naturbrukspoeng faller bort. Samisk førstespråk kan gi 1 i tillegg, men ikke ved studier som har samisk kvote. Ukjent studiekvote med bekreftet samisk eller blandet R/S-matematikk krever vurdering, så totalsummen holdes tilbake.
- Karakteranslaget bruker lik vekt og avrunder gjennomsnittet til to desimaler før det multipliseres med ti. Det velger ikke automatisk hvilke karakterer som er tellende.
- Samme språk gir høyst 1,5 poeng, fra maksimalt to nivå samtidig. Ved tre bekreftede nivå i 2026/2027 holdes totalsummen tilbake: saksbehandler må avklare hvilke nivå/karakterer som skal inngå. Separate språk holdes adskilt.

## Kilder og avgrensninger

1. [Kunnskapsdepartementets vedtatte opptaksforskrift, 11. september 2025](https://www.regjeringen.no/contentassets/e17009511aa94a8784864133951af891/forskrift-om-opptak-til-hogare-utdanning.pdf), §§ 5-1 og 5-7: avrunding, realfagssatser, beståttkrav, overlapp og samisk-unntaket. Forskriften krever at overlapp ikke får dobbel uttelling. Den implementerte 2028-versjonen gjetter derfor ikke på en R/S-kombinasjon.
2. [Regjeringens overgangsoversikt](https://www.regjeringen.no/no/aktuelt/slik-blir-de-nye-reglene-for-opptak-til-hoyere-utdanning/id3118553/): fagpoengendringene gjelder fra opptaket 2028–2029, også for tidligere kandidater.
3. [Samordna opptak om språkpoeng, 10. april 2026](https://www.ung.no/oss/fUI25J0bgbprmss39udJq0): språkgrense og kun to nivå ved rangering.
4. [Samordna opptak om hvilke språk som gir poeng](https://www.ung.no/oss/ULQuDpwmuXul1hz9zLUOEW): programfag, ikke fellesfag, engelsk eller skandinaviske språk.
5. [Samordna opptak om realfagspoeng og overlapp](https://www.ung.no/oss/eD6I5BxmGj7lB3aW5FfPUQ): 4 samlet og høyst 1,5 for samme/overlappende fag, med S1 + S2 + R2 som eksempel.
6. [Udir: fremmedspråk for privatister](https://www.udir.no/eksamen-og-prover/eksamen/privatist/fremmedsprak-for-privatister/) og [fagkoder for fremmedspråk programfag](https://www.udir.no/lk20/psp01-04/fagkoder): forslag til språk og nivå. Katalogen er en veiviser; den bekrefter ikke at brukerens konkrete dokumentasjon er godkjent.
7. [Bryne videregående skole: fremmedspråkpoeng](https://www.bryne.vgs.no/hovedmeny/utdanningstilbod/studiespesialisering/sprak-samfunnsfag-og-okonomiske-fag/morsmalseksamen-niva-3/): programfag I/II gir 0,5 og III gir 1,0. [Udirs vurderingsordning PSP01-04](https://www.udir.no/lk20/psp01-04/vurderingsordning): to standpunktkarakterer for elever og både muntlig og skriftlig eksamen for privatister på alle tre nivå.

Historiske fag, utenlandsk utdanning, særskilte fritak og andre individuelle godkjenninger må vurderes av opptaksorganet. Ingen poeng gis automatisk for ord som ligner et fag. Testene i `src/lib/admission.test.mjs` dekker årsskifte, grenser, språkvalg, duplikater, ugyldige verdier og betinget samiskpoeng.
