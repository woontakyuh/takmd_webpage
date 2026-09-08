# Physical control panels — 2026-09-08

Companion to DESIGN.md §§50–56. These panels reconstruct the approved devices as DOM/CSS controls, preserving the existing callbacks and independent room/Halo settings. They do not connect to real hardware.

## Reference contract

- BenQ ScreenBar Halo 2: [official product](https://www.benq.com/en-us/lighting/monitor-light/screenbar-halo-2.html), [official controller photograph](https://image.benq.com/is/image/benqco/effortless-precision). Both inspected in a browser. Dark metallic outer ring, recessed round glass, sloped face and deeper rear housing; luminous numeric readout. The ring adjusts the selected brightness or Kelvin setting; glass buttons select each mode and toggle power.
- Lutron Palladiom: [official product](https://luxury.lutron.com/us/en/controls/palladiom-keypad), [official keypad photograph](https://luxury.lutron.com/sites/luxuryv2/files/images/products/palladiom/Hero/lutron-luxury-palladiom_keypad-1010x768.jpg). Both inspected in a browser. Tall uninterrupted wallplate, narrow central stack, precise flush rectangular keys, engraved labels and split raise/lower row. Reconstruct in warm ivory to match the room. The two narrow columns operate the left and right shades independently. Each column has full-width up/down arrow keys. Each column includes Open fully and Close fully keys underneath its position readout.
- Room light: original warm-ivory wall dimmer, using the existing room plaster/material palette; large tactile power paddle and a vertical slide with a restrained segmented level indicator. Keep all five existing lighting palettes below the plate.

## Tokens and behaviour

Device panels use existing Manrope, 180ms feedback, 44px hit targets, studio ink/muted/teal and the 280px maximum width. The framing is transparent so the device silhouette and room remain visible. Controls have fixed material tokens independent of day/night: ivory `#eeeae2`, ivory highlight `#f8f6f0`, edge `#c7c3b9`, engraved ink `#5c655f`; Halo metal `#343735`, metal edge `#858981`, glass `#141917`, readout `#e2e8da`, dimmed readout `#89948b`. Day/night changes only the small inherited title/help surfaces.

Halo dial: captured circular pointer dragging, wheel steps, Arrow keys, Page Up/Down and Home/End; clamp at 0–100% or 2700–6500K in 100K steps. Turning brightness enables Halo, while temperature changes preserve power. The native room range retains keyboard and assistive touch support. Shade arrow keys move their own shade while pressed (pointer, Space/Enter or the matching Arrow key); pointer release/cancel/lost capture, key release, focus loss, window blur, hidden document and panel unmount stop travel. A five-second full journey uses one demand-driven RAF per held shade. Assistive click activation takes a 5% step. There is no blind slider. Avoid timers, idle animations and new dependencies. The nearest [beui range-slider source](https://beui.dev/r/range-slider/raw) was read: preserve immediate interruptible control and contained thumb bounds; this project uses direct transforms rather than spring-delayed values. Existing reduced-motion CSS disables feedback transitions.

Popover remains nonmodal with light dismissal and Escape; opening focuses the corresponding primary control without locking the room. Reset local light remains available after manual room adjustment. On narrow/short screens the bounded panel scrolls vertically without page overflow.

## Two-shade refinement

The later user request supersedes the shared shade lift: the panel consumes a readonly [left, right] tuple and invokes the existing per-side callback. Open fully / Close fully make one call for the chosen side; the owner tracks both actual shade positions in one shared state and animates each target independently. A hold interrupts automatic travel at the currently displayed position. Position percentages identify each independently. Hold controls use pointer capture and cancel their frame on all exit paths; no autonomous timer survives panel closure.
