// Extra objects placed inside Bruno's room — edit freely.
// Coordinates are room units (room is ~10 units wide, desk top ≈ y 3.1).
// Tip: open the homepage with ?dbg=1 and click anywhere in the room —
// the clicked world position is printed to the browser console.
export type RoomExtra = {
  glb: string; // from /public/models
  position: [number, number, number];
  rotation?: [number, number, number];
  fit: number; // target size of the largest dimension, in room units
};

export const roomExtras: RoomExtra[] = [
  // Tak's anatomical spine model, left end of the desk
  { glb: '/models/spine.glb', position: [-2.2, 2.57, -4.0], rotation: [0, 0.5, 0], fit: 1.1 },
  // journal stack on the coffee table
  { glb: '/models/journals.glb', position: [0.55, 0.99, 1.15], rotation: [0, 0.45, 0], fit: 0.85 },
  // Bing surfboard leaning on the left wall, next to the guitar
  { glb: '/models/surfboard.glb', position: [-4.55, 0, -2.05], rotation: [0, 0.5, 0.13], fit: 4.4 },
];
