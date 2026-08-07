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
  // more ideas — uncomment and tune positions with ?dbg=1:
  // { glb: '/models/surfboard.glb', position: [3.6, 0, -3.4], rotation: [0, -0.4, -0.08], fit: 4.2 },
  // { glb: '/models/vwbus.glb', position: [-4.4, 5.3, -0.4], rotation: [0, 0.8, 0], fit: 0.7 },
];
