# Oak executive desk provenance

- Site design reference: `deskterior15.jpg`, supplied by the site owner and kept outside `public/`.
- Product reference: `docs/redesign/office-interior-2026-09-07/desk/executive-desk-reference-transparent.png`.
- Product image generator: Higgsfield GPT Image 2, job `a181f392-1e4e-4382-87c1-2f466a57282b`, generated 2026-09-07 KST.
- 3D generator: Higgsfield Tripo H3.1 Image to 3D, job `91e60f1d-7a31-49a6-ac8f-0b5969ed4e8f`, detailed geometry and textures, PBR enabled, 100,000-face limit.
- Shipping asset: `desk-executive-oak.glb`, SHA-256 `9df76f8c3051b19b2a5c55313cd781460774fda3cb42e305effd6dcb8e0cf0f2`.
- Optimization: embedded base-color, metallic/roughness, and OpenGL normal maps resized from 4096 to 2048 pixels with glTF Transform 4.2.1. Geometry is unchanged.

The generated source's long axis lies on Z: raw bounds are x `[-0.21164, 0.21159]`, y `[-0.17278, 0.17280]`, z `[-0.48961, 0.48962]`. `ExecutiveDesk.tsx` rotates it +90 degrees around Y, centers and grounds it, then fits it to the authored 2.2 × 0.7775 × 0.85 m envelope. The desk therefore reaches y=0.7775 exactly while preserving the existing workstation contacts.
