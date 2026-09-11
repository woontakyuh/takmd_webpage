export const PERSONAL_LINKS = {
  email: 'mailto:woontak.yuh@gmail.com',
  hospital: 'https://www.davoshospital.co.kr/depart/page02-detail.html?dr_idx=139',
  instagram: 'https://www.instagram.com/tak_md/',
  youtube: 'https://www.youtube.com/@tak_md/shorts',
  linkedin: 'https://www.linkedin.com/in/woon-tak-yuh-03420311b/',
  workshop: '/education',
  awardShort: 'https://www.youtube.com/shorts/UyUNSzS4AXs',
} as const;

export const SURFBOARD_STORY = {
  title: 'Bing Beacon',
  edition: '60th Anniversary · 9′6″',
  dateTime: '2019-09-30',
  dateLabel: '30 September 2019',
  place: 'Encinitas, California',
  description: 'I picked up this 9′6″, 60th-anniversary Bing Beacon at the Bing factory in Encinitas on 30 September 2019.',
  caption: 'At the factory with the owner, the shaper’s wife.',
  photo: '/images/surfing/bing-factory-2019.webp',
  photoAlt: 'Woon Tak Yuh and the factory owner shaking hands beside his amber Bing Beacon surfboard at the Bing factory in Encinitas.',
  photoWidth: 900,
  photoHeight: 1200,
} as const;

export const personalInterests = {
  bjj: {
    title: 'Jiu-jitsu.',
    eyebrow: 'Outside the office / On the mat',
    introduction: 'Brazilian jiu-jitsu is part of Woon Tak Yuh’s life outside clinical practice.',
    object: 'The gi & the belt',
    description: 'A white Control gi and a blue belt with three stripes hang beside the short white coat. Training is another part of life beyond the hospital.',
    route: '/jiu-jitsu',
    action: 'About jiu-jitsu',
    emailSubject: 'Jiu-jitsu — hello from your office',
  },
  surfing: {
    title: 'Surfing.',
    eyebrow: 'Outside the office / By the sea',
    introduction: SURFBOARD_STORY.description,
    object: `${SURFBOARD_STORY.title} · ${SURFBOARD_STORY.edition}`,
    description: SURFBOARD_STORY.caption,
    route: '/surfing',
    action: 'About surfing',
    emailSubject: 'Surfing — hello from your office',
  },
} as const;

export type PersonalInterest = keyof typeof personalInterests;
