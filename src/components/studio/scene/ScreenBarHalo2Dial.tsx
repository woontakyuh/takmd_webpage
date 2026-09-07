import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CanvasTexture, CylinderGeometry, SRGBColorSpace } from 'three';
import type { Point } from './config';

const DIAL = {
  diameter: 0.074,
  maxHeight: 0.0395,
  baseHeight: 0.0022,
  metalRadius: 0.037,
  rotatingRingRadius: 0.0355,
  glassRadius: 0.034,
  topTilt: Math.PI / 18,
} as const;

const TILT_TANGENT = Math.tan(DIAL.topTilt);
const TOP_CENTER_HEIGHT = DIAL.maxHeight - DIAL.metalRadius * TILT_TANGENT;
const SHELL_HEIGHT = TOP_CENTER_HEIGHT - DIAL.baseHeight;
const SURFACE_ROTATION = -Math.PI / 2 + DIAL.topTilt;

type HaloDialProps = {
  readonly position: Point;
};

export function ScreenBarHalo2Dial({ position }: HaloDialProps) {
  const shell = useMemo(() => createSlopedDialShell(), []);
  const display = useHaloDialDisplay();
  useEffect(() => () => shell.dispose(), [shell]);

  return <group name="ScreenBar Halo 2 wireless dial" position={[...position]}>
    <mesh name="thin dark rubber dial base" position={[0, DIAL.baseHeight / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[DIAL.diameter / 2, DIAL.diameter / 2, DIAL.baseHeight, 64]} />
      <meshStandardMaterial color="#181A18" roughness={0.88} metalness={0.04} />
    </mesh>
    <mesh name="sloped grey aluminium dial shell" geometry={shell} castShadow receiveShadow>
      <meshPhysicalMaterial color="#6D716E" roughness={0.31} metalness={0.84}
        clearcoat={0.08} clearcoatRoughness={0.46} />
    </mesh>
    <SlopedSurface offset={0.00016}>
      <mesh name="dark metal rotating ring" castShadow receiveShadow>
        <circleGeometry args={[DIAL.rotatingRingRadius, 64]} />
        <meshPhysicalMaterial color="#4A4E4B" roughness={0.29} metalness={0.82}
          clearcoat={0.11} clearcoatRoughness={0.42} />
      </mesh>
    </SlopedSurface>
    <SlopedSurface offset={0.00038}>
      <mesh name="recessed round black glass touch panel" castShadow receiveShadow>
        <circleGeometry args={[DIAL.glassRadius, 64]} />
        <meshPhysicalMaterial color="#090B0A" roughness={0.14} metalness={0.3}
          clearcoat={0.76} clearcoatRoughness={0.16} />
      </mesh>
    </SlopedSurface>
    <SlopedSurface offset={0.00061}>
      <mesh name="wireless dial circular OLED readout">
        <circleGeometry args={[DIAL.glassRadius * 0.95, 64]} />
        <meshBasicMaterial map={display} transparent alphaTest={0.03} depthWrite={false} toneMapped={false} />
      </mesh>
    </SlopedSurface>
  </group>;
}

function SlopedSurface({ offset, children }: { readonly offset: number; readonly children: ReactNode }) {
  return <group position={[0, TOP_CENTER_HEIGHT + Math.cos(DIAL.topTilt) * offset, Math.sin(DIAL.topTilt) * offset]}
    rotation={[SURFACE_ROTATION, 0, 0]}>
    {children}
  </group>;
}

function createSlopedDialShell() {
  const geometry = new CylinderGeometry(DIAL.metalRadius, DIAL.metalRadius, SHELL_HEIGHT, 64, 1, false);
  const positions = geometry.getAttribute('position');
  const topEdge = 0;
  for (let index = 0; index < positions.count; index += 1) {
    if (positions.getY(index) > topEdge) {
      positions.setY(index, positions.getY(index) - positions.getZ(index) * TILT_TANGENT);
    }
  }
  positions.needsUpdate = true;
  geometry.translate(0, DIAL.baseHeight + SHELL_HEIGHT / 2, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function useHaloDialDisplay() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 768;
    const context = canvas.getContext('2d');
    if (context) drawDialDisplay(context, canvas.width, canvas.height);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.generateMipmaps = false;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function drawDialDisplay(context: CanvasRenderingContext2D, width: number, height: number) {
  const center = width / 2;
  const muted = 'rgba(191, 204, 194, 0.66)';
  const bright = 'rgba(224, 233, 224, 0.94)';
  context.clearRect(0, 0, width, height);
  drawBrightnessIcon(context, 174, 286, muted);
  drawTemperatureIcon(context, 587, 386, muted);
  drawBrightnessIcon(context, 174, 483, muted);
  context.fillStyle = bright;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '500 65px Arial, sans-serif';
  context.fillText('50%', center, 286);
  context.fillText('3500 K', center, 386);
  context.fillText('50%', center, 483);
  context.fillStyle = muted;
  context.font = '500 31px Arial, sans-serif';
  context.fillText('BenQ', 466, 168);

}

function drawBrightnessIcon(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.beginPath();
  context.arc(x, y, 24, 0, Math.PI * 2);
  context.stroke();
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4;
    const start = 36;
    const end = 51;
    context.beginPath();
    context.moveTo(x + Math.cos(angle) * start, y + Math.sin(angle) * start);
    context.lineTo(x + Math.cos(angle) * end, y + Math.sin(angle) * end);
    context.stroke();
  }
  context.restore();
}

function drawTemperatureIcon(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x, y - 40);
  context.lineTo(x, y + 16);
  context.arc(x, y + 28, 14, 0, Math.PI * 2);
  context.moveTo(x - 11, y - 40);
  context.lineTo(x + 11, y - 40);
  context.stroke();
  context.restore();
}
