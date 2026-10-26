import { BufferGeometry, Float32BufferAttribute, Shape } from 'three';

export function roundedRectangle(width: number, height: number, radius: number) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth, halfHeight);
  return new Shape()
    .moveTo(-halfWidth + corner, -halfHeight)
    .lineTo(halfWidth - corner, -halfHeight)
    .quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner)
    .lineTo(halfWidth, halfHeight - corner)
    .quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight)
    .lineTo(-halfWidth + corner, halfHeight)
    .quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner)
    .lineTo(-halfWidth, -halfHeight + corner)
    .quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);
}

export function appleMarkShapes() {
  const body = new Shape()
    .moveTo(4.02, 16.23)
    .bezierCurveTo(3.77, 16.07, 3.51, 15.84, 3.25, 15.52)
    .bezierCurveTo(3.07, 15.31, 2.85, 15.01, 2.59, 14.62)
    .bezierCurveTo(2.14, 13.97, 1.77, 13.22, 1.49, 12.37)
    .bezierCurveTo(1.18, 11.44, 1.03, 10.55, 1.03, 9.68)
    .bezierCurveTo(1.03, 8.71, 1.24, 7.86, 1.65, 7.15)
    .bezierCurveTo(1.97, 6.58, 2.4, 6.13, 2.95, 5.8)
    .bezierCurveTo(3.5, 5.46, 4.08, 5.29, 4.71, 5.28)
    .bezierCurveTo(4.93, 5.28, 5.16, 5.31, 5.41, 5.37)
    .bezierCurveTo(5.59, 5.42, 5.81, 5.5, 6.07, 5.6)
    .bezierCurveTo(6.41, 5.73, 6.6, 5.81, 6.66, 5.83)
    .bezierCurveTo(6.86, 5.9, 7.03, 5.93, 7.16, 5.93)
    .bezierCurveTo(7.26, 5.93, 7.4, 5.9, 7.56, 5.85)
    .bezierCurveTo(7.65, 5.82, 7.82, 5.76, 8.06, 5.66)
    .bezierCurveTo(8.3, 5.57, 8.49, 5.5, 8.64, 5.44)
    .bezierCurveTo(8.87, 5.37, 9.09, 5.31, 9.29, 5.28)
    .bezierCurveTo(9.53, 5.24, 9.77, 5.23, 10, 5.25)
    .bezierCurveTo(10.44, 5.28, 10.84, 5.37, 11.2, 5.51)
    .bezierCurveTo(11.83, 5.76, 12.34, 6.16, 12.72, 6.72)
    .bezierCurveTo(12.56, 6.82, 12.41, 6.93, 12.27, 7.06)
    .bezierCurveTo(11.96, 7.34, 11.7, 7.65, 11.51, 7.99)
    .bezierCurveTo(11.24, 8.47, 11.11, 9, 11.11, 9.55)
    .bezierCurveTo(11.12, 10.22, 11.29, 10.81, 11.63, 11.32)
    .bezierCurveTo(11.87, 11.69, 12.19, 12.01, 12.58, 12.27)
    .bezierCurveTo(12.77, 12.4, 12.94, 12.49, 13.1, 12.55)
    .bezierCurveTo(13.02, 12.81, 12.93, 13.04, 12.85, 13.23)
    .bezierCurveTo(12.63, 13.75, 12.37, 14.22, 12.08, 14.66)
    .bezierCurveTo(11.81, 15.05, 11.6, 15.34, 11.44, 15.53)
    .bezierCurveTo(11.19, 15.83, 10.95, 16.05, 10.71, 16.21)
    .bezierCurveTo(10.43, 16.39, 10.13, 16.48, 9.81, 16.48)
    .bezierCurveTo(9.59, 16.49, 9.38, 16.46, 9.17, 16.4)
    .bezierCurveTo(9.05, 16.36, 8.87, 16.3, 8.64, 16.2)
    .bezierCurveTo(8.41, 16.1, 8.22, 16.03, 8.08, 15.99)
    .bezierCurveTo(7.85, 15.93, 7.61, 15.9, 7.36, 15.9)
    .bezierCurveTo(7.11, 15.9, 6.87, 15.93, 6.64, 15.99)
    .bezierCurveTo(6.48, 16.03, 6.3, 16.1, 6.08, 16.19)
    .bezierCurveTo(5.82, 16.3, 5.65, 16.37, 5.55, 16.4)
    .bezierCurveTo(5.35, 16.46, 5.14, 16.5, 4.94, 16.51)
    .bezierCurveTo(4.62, 16.51, 4.32, 16.42, 4.02, 16.23);
  const leaf = new Shape()
    .moveTo(8.26, 4.81)
    .bezierCurveTo(7.84, 5.02, 7.44, 5.11, 7.04, 5.08)
    .bezierCurveTo(6.98, 4.68, 7.04, 4.27, 7.21, 3.82)
    .bezierCurveTo(7.36, 3.44, 7.56, 3.09, 7.83, 2.78)
    .bezierCurveTo(8.1, 2.47, 8.43, 2.21, 8.84, 2)
    .bezierCurveTo(9.25, 1.79, 9.64, 1.68, 10.01, 1.66)
    .bezierCurveTo(10.06, 2.08, 10.01, 2.5, 9.86, 2.94)
    .bezierCurveTo(9.72, 3.34, 9.51, 3.7, 9.24, 4.03)
    .bezierCurveTo(8.97, 4.36, 8.64, 4.62, 8.26, 4.81);
  return [body, leaf] as const;
}

export function roundedFrustumGeometry(topSize: number, bottomSize: number, height: number, radius: number) {
  const top = roundedRectangle(topSize, topSize, radius).getSpacedPoints(48);
  const bottom = roundedRectangle(bottomSize, bottomSize, radius * bottomSize / topSize).getSpacedPoints(48);
  const positions: number[] = [];
  const indices: number[] = [];
  for (const point of bottom) positions.push(point.x, -height / 2, point.y);
  for (const point of top) positions.push(point.x, height / 2, point.y);
  const count = top.length;
  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;
    indices.push(index, next, count + next, index, count + next, count + index);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
