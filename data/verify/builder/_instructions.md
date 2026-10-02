# Builder-first resolution

You are resolving discrepancies in a property project's data. The site owner's rule: **when sources disagree, the builder's own published information wins.**

For one project you receive:
- `C:\moondesk\falcon\data\verify\briefs\<slug>.txt`: what our site currently publishes
- `C:\moondesk\falcon\data\verify\<slug>.json`: the independent check. Its `checks` with verdict `mismatch` or `partial` (and `unverified` for possession, starting price or RERA) are the items to resolve.

## Which sources count as "the builder"

In order of preference:
1. **The developer's official website**: the corporate domain or the project page on it (e.g. dlf.in, m3mindia.com, sobha.com, emaar-india.com, elandevelopers.com, experion.co, adanirealty.com, birlaestates.com, smartworlddevelopers.com, signatureglobal.in, maxestates.in, conscient.in, bptp.com, aipl.com, puriconstructions.com, trevoc.com, hero homes, tarc.in, anantraj.com, shapoorjipallonji / spreal, parasbuildtech.com, whitelandcorp.com, silverglades, spjgroup, origen, yugeninfra). Confirm the domain really belongs to the developer, for example by checking it is linked from their corporate site.
2. **The developer's brochure, price list or press release**, including a press release reported verbatim by news with the developer named as the source.
3. **The developer's RERA filing**, for registration numbers, the registered completion date, land area and unit counts. This is the builder's own legal declaration. Use it only if (1) and (2) do not state the value.

**These do NOT count, even if they look official:** channel-partner / broker microsites (names like `<project>-gurgaon.com`, `m3mgurugram.co.in`, `<developer>-projects.in`), 99acres, Magicbricks, Housing, Square Yards, NoBroker, PropTiger, Luxuryroof, reratracker, YouTube, blogs and realtycanvas.in.

## What to record

For each item, give the value **as the builder states it**, with the exact URL and a short verbatim quote. If the builder states nothing for that field, put it under `unresolved`. Never fall back to portals, and never guess.

Possession: if the builder's site gives a marketed date and the RERA filing gives a different completion date, record the builder's site date as `possessionDate` and also add a `reraCompletionDate` correction from the filing. Both are useful.

Prices: only a price the builder publishes (an "onwards" price on the project page, or a price list). If the builder says "price on request", record that as unresolved with that note.

## Output

Write `C:\moondesk\falcon\data\verify\builder\<slug>.json` matching `_schema.json` in the same folder. `normalized` formats:
- possessionDate / reraCompletionDate: "YYYY-MM" (or "YYYY")
- startingPrice: integer rupees (₹3.5 Cr = 35000000)
- units / towers / floors: integer
- landArea: number of acres
- reraNumber: the single primary registration string
- additionalRera: array of registration strings, e.g. ["GGM/999/731/2025/102 (Phase 2)"]
- developer / sector / locality: string
- configurations: array of { "label": "3 BHK", "bhk": 3, "areaSqft": 2407, "areaBasis": "carpet" | "super" | "unspecified" }
