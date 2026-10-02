import type { DeskObject } from './types';

// Signature accent — the only saturated color in the scene (outline glow, terminal accent)
export const ACCENT = '#ffb454';

export const DESK_TOP_Y = 0.74;

// Muted, light-eating palette: the sun/lamp drive the mood, materials stay quiet
export const PALETTE = {
  wallBack: '#a9a29a',
  wallSide: '#a39c93',
  floor: '#6e5a45',
  deskTop: '#8a6f52',
  deskLeg: '#4a3d30',
  monitorShell: '#2b2d31',
  shelf: '#7c6650',
  lampShade: '#3c3f45',
  sofa: '#7d7468',
  rug: '#8d8478',
} as const;

export const deskObjects: DeskObject[] = [
  {
    id: 'spine',
    app: 'ube',
    label: 'Spine model & endoscope — clinical practice',
    route: '/ube',
    command: 'open spine.md',
    terminalLines: [
      'UBE / biportal endoscopic spine surgery.',
      'Director, Center for Endoscopic Spine Surgery — Davos Hospital.',
      'Degenerative and tumor pathology, registry-backed outcomes.',
    ],
    glb: '/models/spine.glb',
    glbFit: 0.42,
    position: [-0.82, DESK_TOP_Y, -0.58],
    rotation: [0, 0.4, 0],
    fallback: {
      parts: [
        { kind: 'cylinder', size: [0.045, 0.055, 0.34], position: [0, 0.17, 0], color: '#d8cfc0', roughness: 0.8 },
        { kind: 'box', size: [0.16, 0.02, 0.1], position: [0, 0.34, 0], color: '#c9bfae', roughness: 0.8 },
        { kind: 'cylinder', size: [0.06, 0.08, 0.03], position: [0, 0.015, 0], color: '#3f3a33', roughness: 0.6 },
        { kind: 'cylinder', size: [0.008, 0.008, 0.28], position: [0.11, 0.14, 0.04], rotation: [0, 0, -0.25], color: '#9aa3ad', metalness: 0.7, roughness: 0.3 },
      ],
    },
    hitSize: [0.3, 0.45, 0.26],
    hitOffset: [0, 0.2, 0],
  },
  {
    id: 'journals',
    app: 'cv',
    label: 'Journal stack — publication record',
    route: '/cv',
    command: 'open publications.log',
    terminalLines: [
      'Peer-reviewed publications, synced live from the research database.',
      'Endoscopic spine surgery · imaging & deep learning · ERAS.',
    ],
    glb: '/models/journals.glb',
    glbFit: 0.32,
    position: [0.78, DESK_TOP_Y, -0.62],
    rotation: [0, -0.18, 0],
    fallback: {
      parts: [
        { kind: 'box', size: [0.24, 0.035, 0.32], position: [0, 0.018, 0], color: '#7a5c48', roughness: 0.85 },
        { kind: 'box', size: [0.23, 0.035, 0.3], position: [0.012, 0.054, 0.01], rotation: [0, 0.12, 0], color: '#b8b2a6', roughness: 0.85 },
        { kind: 'box', size: [0.22, 0.03, 0.29], position: [-0.008, 0.086, -0.005], rotation: [0, -0.08, 0], color: '#8f8578', roughness: 0.85 },
        { kind: 'box', size: [0.21, 0.028, 0.28], position: [0.01, 0.115, 0.008], rotation: [0, 0.05, 0], color: '#a4552f', roughness: 0.85 },
      ],
    },
    hitSize: [0.32, 0.22, 0.4],
    hitOffset: [0, 0.08, 0],
  },
  {
    id: 'globe',
    app: 'education',
    label: 'Globe — international teaching & talks',
    route: '/education',
    command: 'open faculty.map',
    terminalLines: [
      'International faculty — cadaver workshops and invited lectures.',
      'Endoscopic spine education across 15+ countries.',
    ],
    glb: '/models/globe.glb',
    glbFit: 0.34,
    position: [-1.04, DESK_TOP_Y, -0.86],
    rotation: [0, -0.35, 0],
    fallback: {
      parts: [
        { kind: 'sphere', size: [0.13, 0, 0], position: [0, 0.21, 0], color: '#5d7a86', roughness: 0.6 },
        { kind: 'torus', size: [0.145, 0.008, 0], position: [0, 0.21, 0], rotation: [0, 0, 0.42], color: '#c2a36b', metalness: 0.5, roughness: 0.4 },
        { kind: 'cylinder', size: [0.012, 0.012, 0.08], position: [0, 0.05, 0], color: '#4a3d30', roughness: 0.7 },
        { kind: 'cylinder', size: [0.07, 0.08, 0.02], position: [0, 0.01, 0], color: '#c2a36b', metalness: 0.5, roughness: 0.4 },
      ],
    },
    hitSize: [0.34, 0.42, 0.34],
    hitOffset: [0, 0.18, 0],
  },
  {
    id: 'brain',
    app: 'research',
    label: 'Brain model & philosophy books — research',
    route: '/research',
    command: 'open research.md',
    terminalLines: [
      'AI research, cognitive neuroscience, philosophy of mind.',
      'Clinical reasoning meets machine learning.',
    ],
    glb: '/models/brain.glb',
    glbFit: 0.28,
    position: [1.08, DESK_TOP_Y, -0.88],
    rotation: [0, -0.35, 0],
    fallback: {
      parts: [
        { kind: 'box', size: [0.2, 0.04, 0.15], position: [0, 0.02, 0], color: '#5c4a63', roughness: 0.85 },
        { kind: 'box', size: [0.19, 0.04, 0.14], position: [0.008, 0.06, 0.005], rotation: [0, 0.1, 0], color: '#3f4a5c', roughness: 0.85 },
        { kind: 'sphere', size: [0.085, 0, 0], position: [0, 0.155, 0], color: '#c98d8d', roughness: 0.75 },
        { kind: 'sphere', size: [0.055, 0, 0], position: [0, 0.13, 0.055], color: '#bd8181', roughness: 0.75 },
      ],
    },
    hitSize: [0.3, 0.32, 0.28],
    hitOffset: [0, 0.13, 0],
  },
  {
    id: 'keyboard',
    app: 'ai',
    label: 'Keyboard — projects & clinical AI workflow',
    route: '/ai',
    command: 'open projects.sh',
    terminalLines: [
      'Dashboards, AI agents, vibe coding.',
      'Clinical AI workflow — from encounter to reusable knowledge.',
    ],
    glb: '/models/keyboard.glb',
    glbFit: 0.44,
    position: [0, DESK_TOP_Y, -0.28],
    fallback: {
      parts: [
        { kind: 'box', size: [0.48, 0.03, 0.17], position: [0, 0.015, 0], rotation: [0.06, 0, 0], color: '#33363c', roughness: 0.6 },
        { kind: 'box', size: [0.44, 0.012, 0.13], position: [0, 0.036, -0.004], rotation: [0.06, 0, 0], color: '#4a4e56', roughness: 0.5 },
      ],
    },
    hitSize: [0.56, 0.12, 0.26],
    hitOffset: [0, 0.03, 0],
  },
  {
    id: 'belt',
    app: 'terminal',
    label: 'Jiu-jitsu belt — personal',
    // TODO: no /about page exists yet — leave route empty until one is added
    command: 'cat personal.txt',
    terminalLines: [
      'Brazilian jiu-jitsu — the other kind of body mechanics.',
      'Discipline transfers: position before submission.',
    ],
    glb: '/models/belt.glb',
    glbFit: 0.22,
    position: [0.62, DESK_TOP_Y, -0.22],
    rotation: [0, 0.5, 0],
    fallback: {
      parts: [
        { kind: 'torus', size: [0.08, 0.022, 0], position: [0, 0.025, 0], rotation: [Math.PI / 2, 0, 0], color: '#2e3138', roughness: 0.8 },
        { kind: 'box', size: [0.16, 0.02, 0.045], position: [0.05, 0.03, 0.05], rotation: [0, 0.4, 0], color: '#2e3138', roughness: 0.8 },
        { kind: 'box', size: [0.05, 0.022, 0.046], position: [0.1, 0.031, 0.07], rotation: [0, 0.4, 0], color: '#8f2f2f', roughness: 0.8 },
      ],
    },
    hitSize: [0.28, 0.14, 0.24],
    hitOffset: [0, 0.04, 0],
  },
  {
    id: 'card',
    app: 'contact',
    label: 'Business card — contact',
    // TODO: replace with the external Blinq URL (external: true) once provided
    route: '/contact',
    command: 'open contact.vcf',
    terminalLines: [
      'Digital business card — email, links, socials.',
      'Fastest route: LinkedIn or the contact page.',
    ],
    glb: '/models/card.glb',
    glbFit: 0.15,
    position: [-0.56, DESK_TOP_Y, -0.24],
    rotation: [0, 0.25, 0],
    fallback: {
      parts: [
        { kind: 'box', size: [0.09, 0.05, 0.06], position: [0, 0.025, 0], color: '#5a4a3a', roughness: 0.7 },
        { kind: 'box', size: [0.085, 0.055, 0.004], position: [0, 0.055, 0.02], rotation: [-0.35, 0, 0], color: '#e8e2d5', roughness: 0.9 },
      ],
    },
    hitSize: [0.18, 0.16, 0.16],
    hitOffset: [0, 0.05, 0],
  },
  {
    id: 'clock',
    label: 'Calendar clock — your local time',
    command: 'date',
    terminalLines: [], // dynamic — filled with visitor-local date/time at hover time
    glb: '/models/clock.glb',
    glbFit: 0.2,
    position: [-0.38, DESK_TOP_Y, -0.68],
    rotation: [0, 0.18, 0],
    fallback: {
      parts: [
        // body is decorative; the live face is a canvas texture added by ClockFace
        { kind: 'box', size: [0.16, 0.1, 0.05], position: [0, 0.05, 0], color: '#3a3d44', roughness: 0.55 },
        { kind: 'box', size: [0.17, 0.012, 0.06], position: [0, 0.006, 0], color: '#2e3138', roughness: 0.6 },
      ],
    },
    hitSize: [0.22, 0.18, 0.14],
    hitOffset: [0, 0.06, 0],
  },
];
