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
    label: "Ground Staked Up Lights Only",
    text: "Generate a landscape lighting design using ONLY Ground Staked Up Lights. Ground Staked Up Lights are fixtures installed at ground level in soil or mulch beds that project light upward onto vertical surfaces. NEVER place these fixtures on the roof, on concrete, or mounted onto the house structure.\n\nPlace Ground Staked Up Lights at the following locations: at the base of the front facade walls on the ground aimed upward to wash light across the brick or stone, at the base of each exterior column or pillar aimed upward to highlight the column, and at the base of prominent trees in the front yard aimed upward into the canopy.\n\nGround Staked Up Lights should be spaced evenly and symmetrical along flat wall surfaces. Each column or pillar receives one Ground Staked Up Light at its base. Each tree receives one or two Ground Staked Up Lights depending on canopy size.\n\nCRITICAL RESTRICTIONS: Do not generate any path lights. Do not generate any walkway lights. Do not generate any bollard lights. Do not generate any post-mounted fixtures. Do not generate any Gutter Mounted Up Lights. Do not generate any soffit lights. Do not generate any downlights. Do not generate any string lights. Do not generate any hanging lights. Do not generate any wall-mounted sconces. Do not generate any step lights. Do not generate any in-ground well lights aimed horizontally. Do not generate any fixtures mounted above ground level.\n\nThe ONLY fixtures that may appear in this design are Ground Staked Up Lights aimed upward. If a fixture is not a Ground Staked Up Light, it must not appear. Verify before rendering that every single fixture in the design is a Ground Staked Up Light pointing upward. Remove any fixture that does not match this description."
  },
  {
    label: "Path Lights Only",
    text: "Generate a landscape lighting design using ONLY path lights. Path lights are short post-mounted fixtures, typically 18 to 24 inches tall, that stand upright and cast light downward onto the ground to illuminate walking surfaces.\n\nPlace path lights at the following locations: along both sides of the front walkway leading to the front door spaced approximately 6 to 8 feet apart in a staggered pattern, along the driveway edge where it meets landscaping spaced approximately 8 to 10 feet apart, along curved garden bed edges adjacent to walkways, and at transition points such as where a walkway meets a patio or step.\n\nPath lights should illuminate the ground surface 8-10 feet and provide safe navigation. They should not aim upward or outward at structures or trees.\n\nCRITICAL RESTRICTIONS: Do not generate any Ground Staked Up Lights. Do not generate any ground-mounted fixtures aimed upward. Do not generate any wall wash lights. Do not generate any tree lights. Do not generate any Gutter Mounted Up Lights. Do not generate any soffit lights. Do not generate any downlights mounted on the house. Do not generate any string lights. Do not generate any hanging lights. Do not generate any wall-mounted sconces. Do not generate any step lights recessed into walls. Do not generate any fixtures mounted on the house structure.\n\nThe ONLY fixtures that may appear in this design are post-mounted path lights standing in the ground aimed downward at walking surfaces. If a fixture is not a path light, it must not appear. Verify before rendering that every single fixture in the design is a path light. Remove any fixture that does not match this description."
  },
  {
    label: "Ground Staked Up Lights + Paths",
    text: "Generate a landscape lighting design using ONLY two fixture types: Ground Staked Up Lights AND post-mounted path lights. No other fixture types are permitted.\n\nGROUND STAKED UP LIGHTS: Place these fixtures at the base of the front facade walls aimed upward to wash light across the brick or stone. Place Ground Staked Up Lights at the base of each exterior column or pillar aimed upward. Place them at the base of prominent trees in the front yard aimed upward into the canopy. Space wall-washing Ground Staked Up Lights symmetrically across the home. Each column receives one fixture. IMPORTANT: These must be on the ground, never on roof/concrete.\n\nPATH LIGHTS: Place post-mounted path lights along both sides of the front walkway leading to the front door spaced approximately 6 to 8 feet apart in a staggered pattern. Place path lights along the driveway edge where it meets landscaping. \n\nCRITICAL RESTRICTIONS: Do not generate any Gutter Mounted Up Lights. Do not generate any soffit lights. Do not generate any downlights mounted on the house. Do not generate any string lights. Do not generate any hanging lights. Do not generate any wall-mounted sconces. Do not generate any step lights. Do not generate any roofline lighting. Do not generate any eave lighting.\n\nThe ONLY fixtures that may appear are Ground Staked Up Lights aimed upward AND post-mounted path lights aimed downward at the ground. Verify before rendering that every fixture is one of these two types. Remove any fixture that does not match."
  },
  {
    label: "Ground Staked + Gutter Mounted Up Lights",
    text: "Generate a landscape lighting design using ONLY two fixture types: Ground Staked Up Lights AND Gutter Mounted Up Lights. No other fixture types are permitted.\n\nGROUND STAKED UP LIGHTS: Place Ground Staked Up Lights at the base of the front facade walls aimed upward to wash light across the brick or stone. Place them at the base of each exterior column or pillar aimed upward. Place them at the base of prominent trees in the front yard aimed upward into the canopy. IMPORTANT: Ground Staked Up Lights must be in the ground, never on roof/concrete.\n\nGUTTER MOUNTED UP LIGHTS: Up light fixtures mounted on the gutter edge/fascia of the first floor shining upwards. These fixtures aim up and wash light up to highlight dormers and the 2nd story architectural features. Gutter Mounted Up Lights only highlight features directly above them.\n\nCRITICAL RESTRICTIONS: Do not generate any path lights. Do not generate any walkway lights. Do not generate soffit lights. Do not generate down lights. Do not generate any bollard lights. Do not generate any post-mounted fixtures in the ground. Do not generate any string lights.\n\nThe ONLY fixtures that may appear are Ground Staked Up Lights aimed upward AND Gutter Mounted Up Lights aimed upwards. Verify before rendering that every fixture is one of these two types."
  },
  {
    label: "Professional Trio",
    text: "Generate a landscape lighting design using ONLY three fixture types: Ground Staked Up Lights, Gutter Mounted Up Lights, AND post-mounted path lights. No other fixture types are permitted.\n\nGROUND STAKED UP LIGHTS: Place at the base of the front facade walls aimed upward to wash light across the brick or stone. Place at the base of each exterior column or pillar aimed upward. Place at the base of prominent trees.\n\nGUTTER MOUNTED UP LIGHTS: Mounted on the gutter edge/fascia of the first floor shining upwards to highlight the 2nd story features.\n\nPATH LIGHTS: Place along walkways and driveway edges.\n\nCRITICAL RESTRICTIONS: Do not generate any soffit lights or downlights unless specifically requested in notes. Only Ground Staked Up Lights, Gutter Mounted Up Lights, and path lights are allowed."
  },
  {
    label: "Christmas Theme",
    text: "Create a Christmas-themed lighting design using only two fixture types: Ground Staked Up Lights and Gutter Mounted Up Lights. All fixtures must use red and green light only.\n\nGround Staked Up Lights: Install every fixture in the soil at ground level, directly in front of the house. Use these to wash lower walls and columns with red and green beams shining upward.\n\nGutter Mounted Up Lights: Attach these directly along the gutter fascia. Aim them upward to graze peaks and upper architecture with red and green light.\n\nDo not add string lights or other decorations. Only Ground Staked Up Lights and Gutter Mounted Up Lights in red and green."
  },
  {
    label: "Halloween Theme",
    text: "Create a Halloween-themed lighting design using only two fixture types: Ground Staked Up Lights and Gutter Mounted Up Lights. All fixtures must use orange and purple light only.\n\nGround Staked Up Lights: Install every fixture in the soil at ground level. Wash walls with orange and purple beams shining upward.\n\nGutter Mounted Up Lights: Attach to the gutter fascia, shining up at eaves and upper peaks.\n\nSpooky and professional look using only Ground Staked Up Lights and Gutter Mounted Up Lights."
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