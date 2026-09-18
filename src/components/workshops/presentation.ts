import photos from '../../data/workshop-photos.json';
const roles = ['group', 'lecture', 'practice', 'venue'];
export function sessionPhotos(id: string) {
  return photos.filter(photo => photo.sessionId === id).sort((a, b) => roles.indexOf(a.role) - roles.indexOf(b.role) || a.order - b.order);
}
export function sessionCover(id: string) {
  const images = sessionPhotos(id);
  return images.find(photo => photo.role === 'group') ?? images.find(photo => photo.role === 'practice');
}
export function workshopDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
