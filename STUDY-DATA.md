# Datagrunnlag for studiesøk

Dataene kommer fra [Samordna opptaks offisielle rapport «Poenggrenser»](https://rapport-dv.educloud.no/t/SO-datavarehus/views/Poenggrenserogventelistetallhovedopptaksuppleringsopptak_16275618215770/Poenggrenser). Siste publiserte år i eksporten er **2026**.

## Filer og oppdatering

- `public/data/samordna-opptak-poenggrenser-raw.csv`: uendret offisiell eksport, UTF-8 og semikolon som skilletegn.
- `public/data/studies-2026.json`: normalisert datasett med `meta` og `programs`. Eksakt nedlastingstid og SHA-256 for råfilen ligger i `meta`.
- [Offentlig CSV-eksport](https://rapport-dv.educloud.no/t/SO-datavarehus/views/Poenggrenserogventelistetallhovedopptaksuppleringsopptak_16275618215770/Poenggrenser.csv?:showVizHome=no).

CSV-lenken bruker [Tableaus dokumenterte eksportformat](https://help.tableau.com/current/pro/desktop/en-gb/link_view.htm). Ingen læresteds-, studiesteds-, studiekode-, fag- eller kvotefiltre ble lagt til. Et nytt uttrekk må avstemmes og normaliseres på nytt før det erstatter datasettet.

## Dekning og kontroll

Uttrekket inneholder **1369 unike studiekoder fra 27 læresteder** og **5412 rader**. Begge hovedkvoter er med: førstegangsvitnemålskvote og ordinær kvote. Hovedopptak og suppleringsopptak holdes atskilt. 1337 studier har fire rader; 32 har to. Ingen studiekode/kvote/opptaksrunde forekommer flere ganger.

Antall studier og læresteder samsvarer med [HK-dirs samlede tall for opptaket i 2026](https://hkdir.no/rapporter-undersokelser-og-statistikk/les-rapporten/tilbudstall-for-universitet-og-hogskoler-i-samordna-opptak-2026/hovedtrekk-ved-arets-sokertall). Dekningen gjelder Samordna opptak. Lokale opptak, andre kvoter og studier utenfor Samordna opptak er ikke dekket.

Lærestedene i eksporten er AHO, AHS, DMMH, FIH, HIM, HIØ, HVL, HVO, INN, LDH, MF, NHH, NIH, NLA, NMBU, NORD, NTNU, OSLOMET, PHS, SA/SH, UIA, UIB, UIO, UIS, UIT, USN og VID. Kildens forkortelser og studiekoder er bevart.

## Format og betydning

Hvert studie har `id`, `code`, `name`, `institution`, `location`, `field`, `year` og `quotas`. Hver kvote har `name`, `round`, `cutoff`, `value` og `status`. `cutoff` bevarer den opprinnelige tallteksten. `value` er bare et tall når grensen er positiv.

| Kildens verdi | Status | Betydning |
| --- | --- | --- |
| Over 0 | `threshold` | Publisert poenggrense i den angitte kvoten og opptaksrunden. |
| 0 | `all-qualified` | Alle kvalifiserte søkere fikk tilbud. `value` er `null`. |
| -1 | `not-published` | Poenggrensen er ikke oppgitt. `value` er `null`. |

Spesialverdiene er kontrollert mot fotnoten i den offisielle rapportens bildeeksport. Råfilen har 1835 positive grenser, 3490 nullverdier og 87 verdier på -1. Mellomrom rundt tekstfelt fjernes ved normalisering; ingen studier eller kvoter filtreres bort.

Poenggrenser er historiske og garanterer ikke opptak. Opptakskrav må også være oppfylt. Rapporten opplyser at kjønnspoeng og opptaksprøvepoeng inngår ved enkelte studier, blant annet ved AHO. Slike poenggrenser kan derfor ikke alltid sammenlignes direkte med et vanlig poenganslag.
