# Office conference calendar

Snapshot reviewed 11 September 2026. `src/data/conference-calendar.json` contains public academic event metadata from the owner's Notion Schedule, including attendance and faculty participation. It is a curated personal conference calendar, not an exhaustive society calendar or live attendance feed.

Sources: existing checked-in `presentations.json` and live Schedule data source `6fb4e9fe-4d60-4259-925b-cae98429fd42`. Only title, calendar dates, venue and role are published. No page bodies, attendee lists, internal meeting details or Notion links are included. English names use the existing schedule translations; added attendance-only event names/venues are translated from the source records.

Five additional reviewed academic records: KNS Spring Meeting (17–19 April 2025), WUBE (25–26 April 2025), 11th Neurospine Symposium (12 December 2025), 9th Neurospine Symposium (13 December 2025), and KOSESS Summit (14–15 March 2026). Their IDs are retained in the snapshot for deduplication. The two differently numbered Neurospine events retain the owner's source titles.

Spine Summit, 26–28 February 2026, is labeled Faculty according to the owner's explicit correction; the source's presentation flag is inaccurate. Multi-day conference end dates are retained from Notion. A blank venue remains blank rather than being guessed. September 2026 has no listed event; October and November each have two scheduled conference records.

Internal executive/committee meetings, staff training, company interviews and standalone company lectures are excluded even where the source uses a Conference category. Source categories alone do not establish a public conference: several genuine conferences are tagged Spine instead. Future refreshes must review new event IDs against this same scope, preserve owner corrections and avoid publishing an unfiltered Schedule export.
