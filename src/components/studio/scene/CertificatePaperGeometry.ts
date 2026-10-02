import { PlaneGeometry } from 'three';

export function certificatePaperGeometry(width: number, height: number, id: string) {
  const geometry = new PlaneGeometry(width, height, 32, 24);
  if (id !== 'komiss-life-membership-2023') return geometry;
  const [a, b, c, d] = [[54, 71], [1477, 70], [1450, 1016], [57, 1024]] as const;
  const dx1 = b[0] - c[0];
  const dx2 = d[0] - c[0];
  const dx3 = a[0] - b[0] + c[0] - d[0];
  const dy1 = b[1] - c[1];
  const dy2 = d[1] - c[1];
  const dy3 = a[1] - b[1] + c[1] - d[1];
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    const u = (uv.getX(i) - .035) / (.974 - .035);
    const v = (1 - uv.getY(i) - .068) / (.986 - .068);
    const scale = g * u + h * v + 1;
    const x = ((b[0] - a[0] + g * b[0]) * u + (d[0] - a[0] + h * d[0]) * v + a[0]) / scale;
    const y = ((b[1] - a[1] + g * b[1]) * u + (d[1] - a[1] + h * d[1]) * v + a[1]) / scale;
    uv.setXY(i, x / 1517, 1 - y / 1037);
  }
  return geometry;
}
