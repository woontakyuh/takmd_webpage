export const TV_TEACHING_TOPICS = [
  { path: '/ube', title: 'UBE practice' },
  { path: '/workshops/dummy', title: 'Simulation' },
  { path: '/workshops/animal-pig', title: 'Animal lab' },
  { path: '/workshops/cadaver', title: 'Cadaver' },
] as const;

export function tvTeachingTopic(path: string | null) {
  if (!path) return undefined;
  return TV_TEACHING_TOPICS.find(topic => topic.path === path.split(/[?#]/)[0].replace(/\/$/, ''));
}
