import type { WhiskyBottleId } from './WhiskyInspectionState';

type WhiskyInfo = {
  readonly brand: string;
  readonly expression: string;
  readonly origin: string;
  readonly style: string;
  readonly strength: string;
  readonly age: string;
  readonly volume: string;
  readonly story: string;
  readonly character: string;
  readonly source: string;
};

export const WHISKY_BOTTLE_INFO = {
  '/models/whisky/hibiki-masters-select.jpg': {
    brand: 'Hibiki', expression: 'Japanese Harmony · Master’s Select', origin: 'Japan',
    style: 'Blended Japanese whisky', strength: '43%', age: 'No age statement', volume: '700 ml',
    story: 'A travel-retail blend in the Hibiki Japanese Harmony range, introduced in 2015.',
    character: 'Plums in syrup and rose on the nose, followed by orange marmalade, dark chocolate and a gently bitter finish of wood and spice.',
    source: 'https://thewhiskyphiles.com/2015/10/18/hibiki-japanese-harmony-masters-select/',
  },
  '/models/whisky/ballantines-30.png': {
    brand: 'Ballantine’s', expression: '30 Year Old', origin: 'Scotland',
    style: 'Blended Scotch whisky', strength: '40%', age: '30 years', volume: '750 ml',
    story: 'A blend of rare Scotch whiskies aged for at least 30 years, including stock from distilleries that have since closed.',
    character: 'Pear, peach, honey and floral notes meet vanilla oak, with a long, gentle finish.',
    source: 'https://www.ballantines.com/en/range/ballantines-30-year-old/',
  },
  '/models/whisky/lagavulin-16-classic.jpg': {
    brand: 'Lagavulin', expression: '16 Year Old', origin: 'Islay · Scotland',
    style: 'Single malt Scotch whisky', strength: '43%', age: '16 years', volume: '700 ml',
    story: 'A single malt from southern Islay, matured in oak casks for at least 16 years.',
    character: 'Intense peat smoke, seaweed and iodine-like coastal aromas. Deep sweetness and salinity lead to a long, smoky finish.',
    source: 'https://www.malts.com/en-gb/products/lagavulin-16-year-old-single-malt-scotch-whisky-70cl',
  },
  '/models/whisky/bowmore-17-white-sands.png': {
    brand: 'Bowmore', expression: '17 Year Old · White Sands', origin: 'Islay · Scotland',
    style: 'Single malt Scotch whisky', strength: '43%', age: '17 years', volume: '700 ml',
    story: 'White Sands was introduced for travel retail in 2014 and matured for 17 years in former bourbon casks.',
    character: 'Smoke balanced with ripe fruit and sweet toffee.',
    source: 'https://www.thewhiskyexchange.com/p/27992/bowmore-17-year-old-white-sands',
  },
  '/models/whisky/bookers.png': {
    brand: 'Booker’s', expression: 'Kentucky Straight Bourbon', origin: 'Kentucky · USA',
    style: 'Kentucky straight bourbon', strength: 'Varies by batch', age: 'Varies by batch', volume: '750 ml',
    story: 'Selected in small batches and bottled at barrel strength without dilution, with minimal filtration to preserve the character of each barrel.',
    character: 'Strength, maturation and tasting notes vary from batch to batch.',
    source: 'https://www.beamdistilling.com/bookersbourbon',
  },
  '/models/whisky/glendronach-18-current.png': {
    brand: 'The Glendronach', expression: '18 Year Old', origin: 'Highlands · Scotland',
    style: 'Single malt Scotch whisky', strength: '46%', age: '18 years', volume: '700 ml',
    story: 'A Highland single malt matured in Oloroso sherry casks from Andalucía, Spain.',
    character: 'Fudge, dark brown sugar, stewed fruit and cherries, with layers of allspice, walnut bread and chocolate orange.',
    source: 'https://www.glendronachdistillery.com/product/aged-18-years/',
  },
  '/models/whisky/castarede-xo-20-label.svg': {
    brand: 'Castarède', expression: 'Bas Armagnac · XO 20 ans d’âge', origin: 'Bas-Armagnac · France',
    style: 'Bas-Armagnac', strength: '40%', age: 'At least 20 years', volume: '700 ml',
    story: 'A blend of several vintages, with even the youngest spirit aged in oak for at least 20 years.',
    character: 'Warm fruit and spice aromas, with softened tannins, candied fruit and sugared citrus peel.',
    source: 'https://shop.armagnac-castarede.fr/products/xo-armagnac-castarede-70cl',
  },
} as const satisfies Record<WhiskyBottleId, WhiskyInfo>;
