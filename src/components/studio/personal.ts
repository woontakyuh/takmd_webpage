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
    introduction: 'Surfing is another part of Woon Tak Yuh’s life away from the hospital and the desk.',
    object: 'The surfboard',
    description: 'A board by the wall marks a different kind of time away from the desk: time in the sea.',
    route: '/surfing',
    action: 'About surfing',
    emailSubject: 'Surfing — hello from your office',
  },
} as const;

export type PersonalInterest = keyof typeof personalInterests;
