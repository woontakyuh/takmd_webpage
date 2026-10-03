/** Build-time visual variant; interaction, content and lighting state stay shared. */
export const SIMPLE_OFFICE = import.meta.env.PUBLIC_OFFICE_STYLE === 'simple';
export const MAQUETTE = {
  cream: '#E8DFCF', cushion: '#DED2BE', timber: '#BA9C72',
  foliage: '#547058', foliageLight: '#6D835F', graphite: '#303632', metal: '#A3AAA4',
  soil: '#403B2F', glass: '#A2B8A7', plush: '#DCBFB7', plushSnout: '#D2AAA2',
  plushLimbs: '#D5B1A8', plushDetail: '#A97E76', guitar: '#A63F25', pickguard: '#E4D5B2', strings: '#D0CEBD',
} as const;

const SIMPLE_MODELS: Readonly<Record<string, string>> = {
  '/models/florence-knoll/relaxed-two-seater-ivory-packed.glb': '/models/simple/sofa.glb?v=faithful-1',
  '/models/noguchi/table-packed.glb': '/models/simple/table.glb?v=faithful-1',
  '/models/eames/lounge.glb': '/models/simple/lounge.glb?v=faithful-1',
  '/models/eames/ottoman.glb': '/models/simple/ottoman.glb?v=faithful-1',
  '/models/fender/stratocaster-sunburst.glb': '/models/simple/guitar.glb?v=faithful-1',
  '/models/fender/stratocaster-phone.glb': '/models/simple/guitar.glb?v=faithful-1',
  '/models/workshop/plush-pig-packed.glb': '/models/simple/pig.glb',
  '/models/plant-dypsis/scene-packed.glb': '/models/simple/plant.glb',
  '/models/garments/physician-coat-2k.glb': '/models/simple/coat.glb',
  '/models/garments/physician-coat-phone.glb': '/models/simple/coat.glb',
  '/models/garments/control-gi.glb': '/models/simple/gi.glb',
  '/models/garments/control-gi-phone-packed.glb': '/models/simple/gi.glb',
  '/models/spine.glb': '/models/simple/spine.glb',
  '/models/workshop/biportal-endoscope.glb': '/models/simple/endoscope.glb',
};
export function officeModel(path: string): string {
  return SIMPLE_OFFICE ? SIMPLE_MODELS[path.split('?')[0]] ?? path : path;
}
