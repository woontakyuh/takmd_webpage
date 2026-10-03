import type { CanvasTexture } from 'three';

const captureRevisions = new WeakMap<CanvasTexture, number>();

export async function captureMonitorSurface(source: HTMLElement, texture: CanvasTexture, pixelRatio = 1): Promise<boolean> {
  const revision = (captureRevisions.get(texture) ?? 0) + 1;
  captureRevisions.set(texture, revision);
  try {
    const canvas: unknown = texture.image;
    if (!(canvas instanceof HTMLCanvasElement)) return false;
    const surface = source.closest<HTMLElement>('.monitor-screen-reader');
    if (!surface) return false;
    const width = source.clientWidth, height = source.clientHeight;
    const surfaceClone = surface.cloneNode(true);
    if (!(surfaceClone instanceof HTMLElement)) return false;
    const clone = surfaceClone.querySelector<HTMLElement>('.monitor-screen-content');
    if (!clone) return false;
    const staging = document.createElement('div');
    staging.className = source.closest('.loading-monitor-reader[data-entry-reader=true]')
      ? 'monitor-inline-reader' : surface.parentElement?.className ?? '';
    staging.style.position = 'fixed';
    staging.style.left = '-10000px';
    staging.style.top = '0';
    staging.style.width = `${source.clientWidth}px`;
    staging.style.height = `${source.clientHeight}px`;
    staging.style.overflow = 'hidden';
    const inheritedStyle = getComputedStyle(surface);
    surfaceClone.style.position = 'relative';
    surfaceClone.style.left = '0';
    surfaceClone.style.top = '0';
    surfaceClone.style.font = inheritedStyle.font;
    surfaceClone.style.letterSpacing = inheritedStyle.letterSpacing;
    surfaceClone.style.color = inheritedStyle.color;
    clone.style.width = `${source.clientWidth}px`;
    clone.style.height = `${source.clientHeight}px`;
    clone.style.overflow = 'hidden';
    clone.style.filter = 'none';
    const sourceNodes = [source, ...source.querySelectorAll<HTMLElement>('*')];
    const cloneNodes = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
    sourceNodes.forEach((node, index) => {
      const target = cloneNodes[index];
      if (!target) return;
      const style = getComputedStyle(node);
      for (const property of style) target.style.setProperty(property, style.getPropertyValue(property));
    });
    clone.style.overflow = 'hidden';
    clone.style.filter = 'none';
    const content = clone.firstElementChild;
    if (content instanceof HTMLElement) {
      content.style.transform = `translateY(${-source.scrollTop}px)`;
      content.style.transformOrigin = 'top left';
    }
    staging.append(surfaceClone);
    document.body.append(staging);
    const snapshot = await (async () => {
      await document.fonts.ready;
      const { toCanvas } = await import('html-to-image');
      return toCanvas(clone, {
        backgroundColor: '#F8F6F0', width, height,
        pixelRatio, skipAutoScale: true, skipFonts: true,
        // html-to-image rounds font sizes down; retain the exact inline sizes copied above.
        includeStyleProperties: [...getComputedStyle(clone)].filter(property => property !== 'font-size'),
      });
    })().finally(() => staging.remove());
    if (captureRevisions.get(texture) !== revision) return false;
    const context = canvas.getContext('2d');
    if (!context) return false;
    context.resetTransform();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
    texture.needsUpdate = true;
    return true;
  } catch (error) {
    if (error instanceof Error) return false;
    return false;
  }
}
