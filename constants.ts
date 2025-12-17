import { ColorTemperature, FixturePricing } from './types';

export const COLOR_TEMPERATURES: ColorTemperature[] = [
  { 
    id: '2700k', 
    kelvin: '2700K', 
    color: '#FFB46B', 
    description: 'Warm White' 
  },
  { 
    id: '3000k', 
    kelvin: '3000K', 
    color: '#FFD18E', 
    description: 'Soft White' 
  },
  { 
    id: '4000k', 
    kelvin: '4000K', 
    color: '#FFF2D7', 
    description: 'Cool White' 
  },
  { 
    id: '5000k', 
    kelvin: '5000K', 
    color: '#E3F2FD', 
    description: 'Daylight' 
  },
];

export const QUICK_PROMPTS = [
  {
    label: "Up Lights Only",
    text: "Use ONLY Ground Staked Up Lights at the base of the 1st story walls and trees. Keep the 2nd story and roofline COMPLETELY DARK. Absolutely NO soffit lights. Do not add any landscape features that aren't in the photo."
  },
  {
    label: "Path Lights Only",
    text: "Use ONLY path lights along existing walkways. Do not light the house at all. Keep everything dark except the paths. No hallucinations."
  },
  {
    label: "Up Lights + Paths",
    text: "Ground Staked Up Lights for the 1st floor facade and existing trees, plus path lights for walkways. Keep the 2nd story and eaves dark. No soffit lights."
  },
  {
    label: "Up Lights + Gutter Up Lights",
    text: "Ground Staked Up Lights for 1st story. Use Gutter Mounted Up Lights on 1st floor gutters to light the 2nd story. Absolutely NO soffit lights. Do not add extra architecture."
  },
  {
    label: "Up Lights+ Gutter Up Lights+ Path Lights",
    text: "The complete professional package: 1. Ground Staked Up Lights for 1st story and trees. 2. Gutter Mounted Up Lights for 2nd story architectural features. 3. Path lights for walkways. No soffit lights. Keep 2nd story dark if no gutter mounts exist."
  },
  {
    label: "Christmas Theme",
    text: "Red and Green lighting using Ground Staked Up Lights and Gutter Mounted Up Lights. Keep 2nd story dark unless gutter mounts are used. No soffit lights. No extra decorations."
  },
  {
    label: "Halloween Theme",
    text: "Orange and Purple lighting using Ground Staked Up Lights for walls and trees. Keep the 2nd story dark. No soffit lights. No added scary objects."
  }
];

export const STRIPE_CONFIG = {
  PLANS: {
    MONTHLY: {
      id: 'price_monthly_12345',
      name: 'Pro Monthly',
      price: 49,
      interval: 'month',
      label: '$49 / mo'
    },
    YEARLY: {
      id: 'price_yearly_67890',
      name: 'Pro Yearly',
      price: 499,
      interval: 'year',
      label: '$499 / yr',
      savings: 'Save 15%'
    }
  }
};

export const DEFAULT_PRICING: FixturePricing[] = [
  {
    id: 'default_up',
    fixtureType: 'up',
    name: 'Solid Cast Brass Ground Staked Up Light: COMPLETELY INSTALLED PRICE',
    description: 'Color: Light Bronze OR Gun Metal Black\nLIFETIME product warranty on the fixture\n1 Year product warranty on LED Bulb: Rated for 30,000 hours\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc ALL included in the fixture price.',
    unitPrice: 175.00
  },
  {
    id: 'default_path',
    fixtureType: 'path',
    name: 'Cast Brass - Modern Path Light: COMPLETELY INSTALLED PRICE',
    description: 'Color: Light Bronze OR Gun Metal Black\nLIFETIME warranty on the fixture\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc. Included in the fixture price.',
    unitPrice: 210.00
  },
  {
    id: 'default_gutter',
    fixtureType: 'gutter',
    name: 'Solid Cast Brass Gutter Mounted Up Light: COMPLETELY INSTALLED PRICE',
    description: 'Color: Light Bronze OR Gun Metal Black\nLIFETIME product warranty on the fixture\n1 Year product warranty on LED Bulb: Rated for 30,000 hours\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc ALL included in the fixture price.',
    unitPrice: 185.00
  },
  {
    id: 'default_transformer',
    fixtureType: 'transformer',
    name: 'Professional Low Voltage Transformer (300W)',
    description: 'Stainless Steel Case\nLifetime Warranty\nPhoto Cell / Timer included\nInstalled with dedicated circuit connection.',
    unitPrice: 350.00
  }
];