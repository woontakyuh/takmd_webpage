# Eat Drink & Be Merry in the office

The October 2017 Liquor Journal stands in the left opening half of the Isidoro cabinet. Opening the cabinet makes the archive available; the cover is not fetched on initial room entry. Clicking the magazine extracts its closed cover, then clicking its paper or using the nearby arrows opens the supplied excerpt and pp. 52–53. Escape/X closes the pages before reversing the shelf-clearance path. Returning the magazine leaves the cabinet open. Selecting a bottle during reading queues it until the magazine is back.

The magazine uses bounded, bending paper packets with conserved left/right thickness. The measured extraction path clears the lining, shelf, guard rail and upper shelf; it turns only after pulling free. Its printed surfaces receive a modest reading emission so the originals remain visible at night. English copy stays next to the object on desktop and below it on narrow screens, without an instruction panel.

The magnetic paper sequence is: original lecture cover → bar exterior → bar interior → all remaining original lecture slides. This produces 28 sheets from 26 original slides plus two photographs. Both bar photographs retain their full aspect ratios. The TV's 26-slide source is not modified. Only nearby paper textures are kept loaded.

Sources and limitations: `public/models/edbm/README.md`. Source hashes and runtime evidence: `.omo/evidence/edbm-magazine-2026-09-12/`.

Run the browser return regression against a preview with `QA_URL=http://127.0.0.1:4338/ node scripts/test-whisky-magazine-return.mjs`. It uses an isolated Chrome instance and actual paper/button clicks; it does not add production debug hooks.

## Proposal memory preparation

`src/components/studio/proposalMemory.ts` is intentionally asset-gated: both poster and video are null until the owner supplies the edited proposal video. No placeholder frame or fictional media appears. `ProposalMemoryFrame.tsx` is connected above the amplifier and will use the same nearby caption with native video controls. Starting that video pauses Beosound; closing or switching objects pauses the video. There is no automatic music resume. Actual poster/video appearance and playback remain unverified until the supplied media is connected.
