import { Color, Matrix3, Vector4 } from 'three';
import type { MeshStandardMaterial } from 'three';
import type { BookQuad, BookSurface } from '../personalBookSurfaces';
import { bookUvAt } from './BookSurface';
import { PALETTE } from './config';

export type MagazineSurface = BookSurface & {
  readonly restoration?: 'cover' | 'contributors' | 'feature-left' | 'feature-right';
};
type PrintPatch = {
  readonly box: readonly [number, number, number, number];
  readonly quad: BookQuad;
  readonly ink?: boolean;
  readonly topCurve?: number;
};

// Rectify the photographed print blocks separately; page edges, tabletop and gutter
// shadows are not part of the printed artwork. Coordinates refer to the supplied scans.
export const MAGAZINE_PRINT_PATCHES: Readonly<Record<NonNullable<MagazineSurface['restoration']>, readonly PrintPatch[]>> = {
  cover: [],
  contributors: [
    { box: [.17,.065,.60,.305], quad: [[.173,.067],[.769,.083],[.757,.376],[.169,.359]] },
    { box: [.045,.29,.225,.20], quad: [[.053,.294],[.267,.295],[.260,.49],[.048,.487]] },
    { box: [.30,.385,.215,.345], quad: [[.306,.378],[.517,.390],[.518,.730],[.289,.723]], ink: true },
    { box: [.55,.38,.215,.18], quad: [[.554,.381],[.758,.385],[.764,.562],[.555,.56]] },
    { box: [.553,.575,.219,.405], quad: [[.554,.573],[.762,.575],[.779,.981],[.548,.973]], ink: true },
    { box: [.041,.503,.22,.42], quad: [[.045,.5],[.262,.506],[.240,.923],[.009,.924]], ink: true },
    { box: [.799,.206,.201,.19], quad: [[.806,.210],[1,.212],[1,.398],[.800,.397]] },
    { box: [.800,.407,.20,.45], quad: [[.800,.406],[1,.414],[1,.863],[.810,.843]], ink: true },
  ],
  'feature-left': [
    { box: [.547,.005,.070,.023], quad: [[.999,.266],[.999,.305],[.975,.305],[.975,.266]], ink: true },
    { box: [0,.038,1,.722], quad: [[.939,0],[.883,.496],[.253,.512],[.237,0]], topCurve: -.06 },
    { box: [.015,.79,.97,.20], quad: [[.224,.008],[.240,.496],[.009,.497],[.009,.008]], ink: true },
  ],
  'feature-right': [
    { box: [.035,.055,.34,.57], quad: [[.87,.518],[.878,.640],[.346,.653],[.356,.519]] },
    { box: [.43,.085,.535,.51], quad: [[.861,.677],[.850,.969],[.374,.971],[.376,.676]], ink: true },
    { box: [.035,.645,.28,.275], quad: [[.337,.524],[.338,.657],[.083,.655],[.084,.526]] },
    { box: [.329,.645,.361,.275], quad: [[.340,.672],[.339,.853],[.091,.847],[.085,.670]] },
    { box: [.704,.645,.261,.275], quad: [[.340,.863],[.339,.981],[.102,.980],[.095,.860]] },
  ],
};

function projectiveMatrix(quad: BookQuad) {
  const [a,b,c,d] = quad;
  const x1=b[0]-c[0],x2=d[0]-c[0],y1=b[1]-c[1],y2=d[1]-c[1];
  const x3=a[0]-b[0]+c[0]-d[0],y3=a[1]-b[1]+c[1]-d[1];
  const determinant=x1*y2-x2*y1;
  const g=(x3*y2-x2*y3)/determinant,h=(x1*y3-x3*y1)/determinant;
  return new Matrix3().set(b[0]-a[0]+g*b[0],d[0]-a[0]+h*d[0],a[0],
    b[1]-a[1]+g*b[1],d[1]-a[1]+h*d[1],a[1],g,h,1);
}

export function magazinePrintUv(surface: MagazineSurface,u: number,v: number) {
  return bookUvAt(surface.quad,u,v);
}

export function restoreMagazinePrint(material: MeshStandardMaterial,surface: MagazineSurface) {
  const kind=surface.restoration;
  if (!kind) return;
  const patches = kind === 'cover' ? [{box:[0,0,1,1] as const,quad:surface.quad}] : MAGAZINE_PRINT_PATCHES[kind];
  material.customProgramCacheKey=()=>`magazine-print-blocks-${kind}`;
  material.onBeforeCompile=shader=>{
    shader.uniforms.printPaper={value:new Color(PALETTE.paperLight)};
    shader.uniforms.printBoxes={value:patches.map(p=>new Vector4(...p.box))};
    shader.uniforms.printTransforms={value:patches.map(p=>projectiveMatrix(p.quad))};
    shader.uniforms.printInk={value:patches.map(p=>'ink' in p&&p.ink?1:0)};
    shader.uniforms.printCurve={value:patches.map(p=>'topCurve' in p?p.topCurve:0)};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nattribute vec2 printCoordinate; varying vec2 vPrintCoordinate;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvPrintCoordinate=printCoordinate;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_pars_fragment>',`#include <map_pars_fragment>
      varying vec2 vPrintCoordinate;
      uniform vec3 printPaper;
      uniform vec4 printBoxes[${patches.length}];
      uniform mat3 printTransforms[${patches.length}];
      uniform float printInk[${patches.length}];
      uniform float printCurve[${patches.length}];
      vec3 magazinePrint() {
        vec3 color=printPaper;
        vec2 p=vPrintCoordinate;
        vec2 pixelX=dFdx(p),pixelY=dFdy(p);
        for(int i=0;i<${patches.length};i++) {
          vec4 b=printBoxes[i];vec2 q=(p-b.xy)/b.zw;
          if(q.x<0.0||q.y<0.0||q.x>1.0||q.y>1.0) continue;
          q.y+=printCurve[i]*sin(3.14159265*q.x)*(1.0-q.y);
          vec3 project=printTransforms[i]*vec3(q,1.0);
          vec2 source=project.xy/project.z;
          vec3 columnU=printTransforms[i][0],columnV=printTransforms[i][1];
          vec2 du=(columnU.xy*project.z-project.xy*columnU.z)/(project.z*project.z);
          vec2 dv=(columnV.xy*project.z-project.xy*columnV.z)/(project.z*project.z);
          vec2 dx=du*pixelX.x/b.z+dv*pixelX.y/b.w;
          vec2 dy=du*pixelY.x/b.z+dv*pixelY.y/b.w;
          vec3 original=textureGrad(map,vec2(source.x,1.0-source.y),dx*vec2(1,-1),dy*vec2(1,-1)).rgb;
          if(printInk[i]>.5) {
            // Neutralize the photographed paper cast while retaining the original ink.
            float density=dot(original,vec3(.2126,.7152,.0722));
            float paper=density;
            vec3 paperColor=original;
            vec2 imagePoint=vec2(source.x,1.0-source.y);
            for(int j=0;j<8;j++) {
              float angle=float(j)*.785398163;
              vec2 offset=vec2(cos(angle),sin(angle))*.008;
              vec3 nearby=textureGrad(map,imagePoint+offset,dx*vec2(1,-1),dy*vec2(1,-1)).rgb;
              float lightness=dot(nearby,vec3(.2126,.7152,.0722));
              if(lightness>paper) { paper=lightness; paperColor=nearby; }
            }
            vec3 loss=max(vec3(0),1.0-original/max(vec3(.01),paperColor)-.02);
            vec3 ink=clamp(1.0-1.3*loss,0.0,1.0);
            color=ink*printPaper;
          } else color=original*vec3(1.0,1.02,1.04);
        }
        return color;
      }`)
      .replace('#include <map_fragment>','vec3 restoredPaper = magazinePrint(); diffuseColor.rgb *= restoredPaper;')
      .replace('#include <emissivemap_fragment>','totalEmissiveRadiance *= restoredPaper;');
  };
  material.needsUpdate=true;
}
