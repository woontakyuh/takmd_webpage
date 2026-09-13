import { MathUtils, Vector2 } from 'three';
import type { MeshStandardMaterial } from 'three';
import type { BookSurface, BookUv } from '../personalBookSurfaces';
import { bookUvAt } from './BookSurface';

export type MagazineSurface = BookSurface & {
  readonly restoration?: 'cover' | 'contributors' | 'feature-left' | 'feature-right';
};
type PrintRow = { readonly v: number; readonly points: readonly BookUv[] };
type PageWarp = { readonly columns: readonly number[]; readonly rows: readonly PrintRow[] };

// These are continuous page coordinates measured on the original photographs.
// Every cell shares its edges: print, whitespace and cropped source edges stay together.
const CONTRIBUTORS: PageWarp = {
  columns: [0, .17, .30, .55, .77, 1],
  rows: [
    { v: 0, points: [[0, 0], [.17, 0], [.30, 0], [.55, 0], [.77, 0], [1, 0]] },
    { v: .075, points: [[0, .057], [.173, .067], [.303, .071], [.552, .077], [.769, .083], [1, .090]] },
    { v: .375, points: [[0, .354], [.169, .359], [.297, .365], [.541, .370], [.757, .376], [1, .381]] },
    { v: .56, points: [[0, .540], [.158, .550], [.290, .556], [.552, .560], [.765, .565], [1, .580]] },
    { v: .98, points: [[0, .98], [.147, .98], [.270, .98], [.550, .98], [.779, .988], [1, .99]] },
    { v: 1, points: [[0, 1], [.17, 1], [.30, 1], [.55, 1], [.77, 1], [1, 1]] },
  ],
};

const FEATURE_COLUMNS = [0, .25, .5, .625, .75, .875, .9375, .96875, .984375, .9921875, .9975, .9992, 1] as const;
const FEATURE_ROWS = [0, .07, .66, .76, .895, .92, 1] as const;
const GUTTER_X = [.493, .494, .508, .514, .500, .500, .500] as const;
const GUTTER_Y = [.068, 145 / 1050, .658, .747, .872, .902476, 1] as const;
const LEFT_PHOTO_TOP = [66, 64, 59, 55, 59, 72, 86, 98, 107, 114, 123, 127, 145].map(y => y / 1050);
const LEFT_PHOTO_BOTTOM = [.765, .765, .762, .760, .758, .753, .751, .749, .748, .748, .747, .747, .747] as const;
const LEFT_TITLE_BASELINE = [.9005, .8985, .8955, .893, .8905, .883, .878, .875, .8735, .873, .872, .872, .872] as const;
const LEFT_TOP = [0, 0, 0, 0, 0, .008, .025, .044, .054, .061, .065, .067, .068] as const;
const RIGHT_COLUMNS = [0, .0625, .125, .1875, .25, .30, .5, .75, 1] as const;
const RIGHT_TOP = [72, 56, 49, 47, 49, 52, 69, 81, 83].map(y => y / 1050);
const RIGHT_PHOTO_TOP = [145, 133, 126, 122, 120, 120, 129, 144, 148].map(y => y / 1050);
const RIGHT_LOWER_TOP = [.658, .657, .656, .656, .656, .657, .661, .660, .660] as const;
const RIGHT_LOWER_BOTTOM = [.916, .918, .921, .922, .920, .919, .915, .907, .900] as const;
const RIGHT_EDGE = [.982, .985, 1, 1, 1, 1, 1] as const;

function featureWarp(side: 'left' | 'right'): PageWarp {
  const columns = side === 'left' ? FEATURE_COLUMNS : RIGHT_COLUMNS;
  const heights = side === 'left' ? [LEFT_TOP, LEFT_PHOTO_TOP,
    LEFT_PHOTO_TOP.map((top, i) => MathUtils.lerp(top, LEFT_PHOTO_BOTTOM[i], .59 / .69)),
    LEFT_PHOTO_BOTTOM, LEFT_TITLE_BASELINE,
    LEFT_TITLE_BASELINE.map(baseline => MathUtils.lerp(baseline, 1, .025 / .105)),
    columns.map(() => 1)] : [RIGHT_TOP, RIGHT_PHOTO_TOP, RIGHT_LOWER_TOP,
    RIGHT_LOWER_TOP.map((top, i) => MathUtils.lerp(top, RIGHT_LOWER_BOTTOM[i], .1 / .26)),
    RIGHT_LOWER_TOP.map((top, i) => MathUtils.lerp(top, RIGHT_LOWER_BOTTOM[i], .235 / .26)),
    RIGHT_LOWER_BOTTOM, columns.map(() => 1)];
  return { columns, rows: FEATURE_ROWS.map((v, row) => ({ v,
    points: columns.map((u, column): BookUv => {
      const gutter = side === 'left' ? column === columns.length - 1 : column === 0;
      const x = side === 'left' ? u * GUTTER_X[row] : MathUtils.lerp(GUTTER_X[row], RIGHT_EDGE[row], u);
      // IMG_5247 is sideways after EXIF normalization; rotate its coordinates only.
      return [1 - (gutter ? GUTTER_Y[row] : heights[row][column]), x];
    }),
  })) };
}

export const MAGAZINE_PAGE_WARPS: Readonly<Record<NonNullable<MagazineSurface['restoration']>, PageWarp>> = {
  cover: { columns: [0, .125, .25, .5, .75, .875, 1], rows: [
    { v: 0, points: [[.066, .027], [.174, .016], [.290, .016], [.518, .027], [.750, .029], [.862, .030], [.977, .030]] },
    { v: .18, points: [[.051, .195], [.168, .190], [.285, .188], [.518, .192], [.752, .195], [.870, .196], [.987, .196]] },
    { v: 1, points: [[.004, .943], [.128, .944], [.253, .945], [.501, .947], [.750, .949], [.875, .950], [.999, .951]] },
  ] },
  contributors: CONTRIBUTORS,
  'feature-left': featureWarp('left'),
  'feature-right': featureWarp('right'),
};

export function magazinePrintUv(surface: MagazineSurface, u: number, v: number): BookUv {
  if (!surface.restoration) return bookUvAt(surface.quad, u, v);
  const warp = MAGAZINE_PAGE_WARPS[surface.restoration];
  const column = Math.max(0, warp.columns.findIndex((end, i) => i > 0 && u <= end) - 1);
  const row = Math.max(0, warp.rows.findIndex((end, i) => i > 0 && v <= end.v) - 1);
  const x = (u - warp.columns[column]) / (warp.columns[column + 1] - warp.columns[column]);
  const y = (v - warp.rows[row].v) / (warp.rows[row + 1].v - warp.rows[row].v);
  const [a, b] = [warp.rows[row], warp.rows[row + 1]];
  return [MathUtils.lerp(MathUtils.lerp(a.points[column][0], a.points[column + 1][0], x),
    MathUtils.lerp(b.points[column][0], b.points[column + 1][0], x), y),
  MathUtils.lerp(MathUtils.lerp(a.points[column][1], a.points[column + 1][1], x),
    MathUtils.lerp(b.points[column][1], b.points[column + 1][1], x), y)];
}

export function restoreMagazinePrint(material: MeshStandardMaterial, surface: MagazineSurface) {
  if (!surface.restoration) return;
  const warp = MAGAZINE_PAGE_WARPS[surface.restoration];
  const width = warp.columns.length, height = warp.rows.length;
  material.customProgramCacheKey = () => `magazine-whole-page-${surface.restoration}`;
  material.onBeforeCompile = shader => {
    shader.uniforms.printColumns = { value: warp.columns };
    shader.uniforms.printRows = { value: warp.rows.map(row => row.v) };
    shader.uniforms.printPoints = { value: warp.rows.flatMap(row => row.points.map(point => new Vector2(...point))) };
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nattribute vec2 printCoordinate; varying vec2 vPrintCoordinate;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPrintCoordinate=printCoordinate;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_pars_fragment>', `#include <map_pars_fragment>
      varying vec2 vPrintCoordinate;
      uniform float printColumns[${width}];
      uniform float printRows[${height}];
      uniform vec2 printPoints[${width * height}];
      vec2 magazineSource() {
        vec2 p=clamp(vPrintCoordinate,0.0,1.0);
        int column=0; int row=0;
        for(int i=1;i<${width - 1};i++) if(p.x>printColumns[i]) column=i;
        for(int i=1;i<${height - 1};i++) if(p.y>printRows[i]) row=i;
        float x=(p.x-printColumns[column])/(printColumns[column+1]-printColumns[column]);
        float y=(p.y-printRows[row])/(printRows[row+1]-printRows[row]);
        int a=row*${width}+column; int b=a+${width};
        return mix(mix(printPoints[a],printPoints[a+1],x),mix(printPoints[b],printPoints[b+1],x),y);
      }`)
      .replace('#include <map_fragment>', `vec2 source=magazineSource();
        vec3 originalPrint=texture2D(map,vec2(source.x,1.0-source.y)).rgb;
        diffuseColor.rgb*=originalPrint;`)
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance*=originalPrint;');
  };
  material.needsUpdate = true;
}
