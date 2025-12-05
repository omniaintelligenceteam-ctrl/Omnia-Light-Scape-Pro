import { ColorTemperature } from './types';

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
    text: "Use only ground-mounted uplights to illuminate the home. Every fixture must be installed in the soil or planting beds at ground level. NEVER on concrete, steps, gutters, porch surfaces, walls, or attached to the house in any way. Place the uplights in a clean, symmetrical layout along the front of the home, at the base of walls, columns, and key architectural features, so beams shine upward and softly wash the façade.\n\nRULE: do not add any gutter-mounted lights, soffit lights, path lights, step lights, tree lights, or fixtures attached to the building. All artificial light in the scene must clearly come from these ground-mounted uplights only, with the rest of the property remaining naturally dark except for subtle ambient night sky."
  },
  {
    label: "Path Lights Only",
    text: "Use only low, ground-level path lights to define the walkways and any visible steps. Place fixtures along the edges of the paths and near changes in elevation, creating small pools of light close to the ground that guide someone safely toward the front door. The light should be soft and controlled, not flooding the walls or trees.\n\nDo not add uplights, gutter-mounted lights, step lights, tree lights, or any fixtures attached to the house or roofline. The house façade, planting beds, and upper architecture should stay mostly dark, acting as a backdrop. All visible artificial lighting must appear to come strictly from these path lights only."
  },
  {
    label: "Up Lights + Paths",
    text: "Use only two fixture types in this design:\n\nGround-mounted uplights, and\nLow path lights.\n\nGround-mounted uplights:\nPlace all uplights in the soil or planting beds at ground level, directly in front of the house or key features.\nDo not mount any uplight on concrete, steps, porches, driveways, or attached to the house itself.\nUse these fixtures to wash the lower walls, columns, and important architectural elements with upward light, arranged in a clean, mostly symmetrical layout across the front elevation.\n\nPath lights:\nInstall only along walkways and near steps at ground level, never on the house, in trees, or on vertical surfaces.\nCreate small, soft pools of light that clearly define the path edges and any changes in elevation, guiding someone safely from the driveway or sidewalk to the front door.\nAvoid throwing strong light onto the walls or upper architecture; the path lights should stay focused low to the ground.\n\nDo not add any other fixture types—no gutter mounts, step lights, tree lights, wall sconces, floodlights, or string lights. All visible artificial lighting must clearly come only from these two categories: ground-mounted uplights on the house and low path lights along the walkways, working together to create a balanced, professional design."
  },
  {
    label: "Up Lights + Gutters",
    text: "Use only two fixture types in this design:\n\nGround-mounted uplights, and\nGutter-mounted uplights.\n\nGround-mounted uplights:\nInstall every fixture in the soil or planting beds at ground level, directly in front of the house.\nDo not place any uplight on concrete, steps, porches, driveways, or attached to the house.\nUse these fixtures to wash the lower walls, columns, and main architectural features from the ground up, in a clean, mostly symmetrical layout.\n\nGutter-mounted uplights:\nAttach these fixtures directly along the gutter / fascia line at the roof edge.\nEach gutter light must clearly appear mounted at that upper edge, never on the ground or floating.\nAim them upward to graze the eaves, peaks, and upper architecture, creating a refined highlight along the roofline.\n\nDo not add any other fixture types—no path lights, step lights, tree lights, wall sconces, floodlights, or string lights. All visible artificial lighting must clearly come only from the ground uplights at the base of the house and the gutter-mounted uplights along the roofline, working together to create a balanced, professional layered design."
  },
  {
    label: "Up + Gutter + Path Layout",
    text: "Design a complete, layered layout using three specific fixture types only: ground-mounted uplights, gutter-mounted uplights, and low path lights.\n\nGround-mounted uplights:\nPlace these in the soil or planting beds at the base of the house, never on concrete or attached to the building.\nUse them to wash the lower walls, columns, and important architectural features with upward light.\n\nGutter-mounted uplights:\nAttach these fixtures directly along the gutter / fascia line, clearly mounted in the gutter.\nONLY aim them upward to highlight the eaves, peaks, and upper architecture.\nThey should never appear on the ground, on the path, or floating in space.\n\nPath lights:\nInstall only along the walkways and near steps at ground level, creating gentle pools of light that guide the approach to the front door.\n\nDo not add any other fixture types such as step lights, Soffit lights, wall sconces, tree lights, floodlights, or string lights. All artificial light in the scene must clearly come from these three categories—ground uplights at the base of the house, gutter-mounted uplights along the roofline, and low path lights along the walk—working together to create a balanced, professional lighting design."
  },
  {
    label: "Christmas Theme",
    text: "Create a Christmas-themed lighting design using only two fixture types:\n\nGround-mounted uplights, and\nGutter-mounted uplights.\n\nAll uplights must use red and green light only, arranged in a tasteful, professional pattern that feels festive but still high-end. You can alternate red and green fixtures or group them by sections of the house (for example, red on one part of the elevation and green on another), but the overall look should be balanced and intentional, not random or chaotic.\n\nGround-mounted uplights:\nInstall every fixture in the soil or planting beds at ground level, directly in front of the house or key features.\nDo not place any uplight on concrete, steps, porches, driveways, or attached to the house.\nUse these fixtures to wash the lower walls, columns, and architectural elements with red and green beams shining upward, creating a clear holiday feel along the front elevation.\n\nGutter-mounted uplights:\nAttach these fixtures directly along the gutter / fascia line at the roof edge.\nEach gutter light must clearly appear mounted at that upper edge, never on the ground or floating.\nAim them upward to graze the eaves, peaks, and upper architecture with red and green light, echoing the look of professional Christmas roofline lighting without adding actual string lights.\n\nDo not add any other fixture types—no path lights, step lights, tree-mounted lights, wall sconces, floodlights, or string lights. Do not invent inflatables, projections, or extra decorations. All visible artificial lighting in the scene must clearly come only from these ground-mounted uplights and gutter-mounted uplights, using red and green colors to create a clean, festive Christmas look that still feels professionally designed."
  },
  {
    label: "Halloween Theme",
    text: "Create a Halloween-themed lighting design using only two fixture types:\n\nGround-mounted uplights, and\nGutter-mounted uplights.\n\nAll uplights must use orange and purple light only, arranged in a tasteful, spooky yet professional pattern. You can alternate orange and purple fixtures or group them by sections of the house (for example, orange on one part of the elevation and purple on another), but the overall look should be balanced and intentional.\n\nGround-mounted uplights:\nInstall every fixture in the soil or planting beds at ground level, directly in front of the house or key features.\nDo not place any uplight on concrete, steps, porches, driveways, or attached to the house.\nUse these fixtures to wash the lower walls, columns, and architectural elements with orange and purple beams shining upward, creating a hauntingly beautiful feel along the front elevation.\n\nGutter-mounted uplights:\nAttach these fixtures directly along the gutter / fascia line at the roof edge.\nEach gutter light must clearly appear mounted at that upper edge, never on the ground or floating.\nAim them upward to graze the eaves, peaks, and upper architecture with orange and purple light, echoing the look of professional holiday lighting.\n\nDo not add any other fixture types—no path lights, step lights, tree-mounted lights, wall sconces, floodlights, or string lights. Do not invent inflatables, projections, or extra decorations. All visible artificial lighting in the scene must clearly come only from these ground-mounted uplights and gutter-mounted uplights, using orange and purple colors to create a clean, Halloween look that still feels professionally designed."
  }
];

export const STRIPE_CONFIG = {
  PLANS: {
    MONTHLY: {
      id: 'price_monthly_12345', // REPLACE WITH REAL STRIPE PRICE ID
      name: 'Pro Monthly',
      price: 49,
      interval: 'month',
      label: '$49 / mo'
    },
    YEARLY: {
      id: 'price_yearly_67890', // REPLACE WITH REAL STRIPE PRICE ID
      name: 'Pro Yearly',
      price: 499,
      interval: 'year',
      label: '$499 / yr',
      savings: 'Save 15%'
    }
  }
};