import type { ColorTemperature, FixturePricing } from "./types";

export const COLOR_TEMPERATURES: ColorTemperature[] = [
  {
    id: "2700k",
    kelvin: "2700K",
    color: "#FFB46B",
    description: "Warm White",
  },
  {
    id: "3000k",
    kelvin: "3000K",
    color: "#FFD18E",
    description: "Soft White",
  },
  {
    id: "4000k",
    kelvin: "4000K",
    color: "#FFF2D7",
    description: "Cool White",
  },
  {
    id: "5000k",
    kelvin: "5000K",
    color: "#E3F2FD",
    description: "Daylight",
  },
];

export const QUICK_PROMPTS = [
  {
    label: "Up Lights Only",
    text:
      "Generate a landscape lighting design using ONLY ground-mounted up lights. Up lights are fixtures installed at ground level that project light upward onto vertical surfaces. NEVER place up lights on the roof, on concrete, or mounted onto the house structure.\n\nPlace up lights at the following locations: at the base of the front facade walls on the ground aimed upward to wash light across the brick or stone, at the base of each exterior column or pillar aimed upward to highlight the column, and at the base of prominent trees in the front yard aimed upward into the canopy.\n\nUp lights should be spaced evenly and symmetrical along flat wall surfaces creating dramatic effects with light and shadows. Each column or pillar receives one up light at its base. Each tree receives one or two up lights depending on canopy size.\n\nCRITICAL RESTRICTIONS: Do not generate any path lights. Do not generate any walkway lights. Do not generate any bollard lights. Do not generate any post-mounted fixtures. Do not generate any Gutter Mounted Up Lights. Do not generate any soffit lights. Do not generate any downlights. Do not generate any string lights. Do not generate any hanging lights. Do not generate any wall-mounted sconces. Do not generate any step lights. Do not generate any in-ground well lights aimed horizontally. Do not generate any fixtures mounted above ground level.\n\nThe ONLY fixtures that may appear in this design are ground-mounted up lights aimed upward. If a fixture is not an up light, it must not appear. Verify before rendering that every single fixture in the design is a ground-mounted up light pointing upward. Remove any fixture that does not match this description.",
  },
  {
    label: "Path Lights Only",
    text:
      "Generate a landscape lighting design using ONLY path lights. Path lights are short post-mounted fixtures, typically 18 to 24 inches tall, that stand upright and cast light downward onto the ground to illuminate walking surfaces.\n\nPlace path lights at the following locations: along both sides of the front walkway leading to the front door spaced approximately 6 to 8 feet apart in a staggered pattern, along the driveway edge where it meets landscaping spaced approximately 8 to 10 feet apart, along curved garden bed edges adjacent to walkways, and at transition points such as where a walkway meets a patio or step.\n\nPath lights should illuminate the ground surface 8-10 feet and provide safe navigation. They should not aim upward or outward at structures or trees.\n\nCRITICAL RESTRICTIONS for PATH LIGHT ONLY Button: Do not generate any up lights. Do not generate any ground-mounted fixtures aimed upward. Do not generate any wall wash lights. Do not generate any tree lights. Do not generate any Gutter Mounted Up Lights. Do not generate any soffit lights. Do not generate any downlights mounted on the house. Do not generate any string lights. Do not generate any hanging lights. Do not generate any wall-mounted sconces. Do not generate any step lights recessed into walls. Do not generate any fixtures mounted on the house structure.\n\nThe ONLY fixtures that may appear in this design are post-mounted path lights standing in the ground aimed downward at walking surfaces. If a fixture is not a path light, it must not appear. Verify before rendering that every single fixture in the design is a path light. Remove any fixture that does not match this description.",
  },
  {
    label: "Up Lights + Path Lights",
    text:
      "Generate a landscape lighting design using ONLY two fixture types: ground-mounted up lights AND post-mounted path lights. No other fixture types are permitted.\n\nUP LIGHTS: Place ground-mounted up lights at the base of the front facade walls aimed upward to wash light across the brick or stone. Place up lights at the base of each exterior column or pillar aimed upward. Place up lights at the base of prominent trees in the front yard aimed upward into the canopy. Space wall-washing up lights symmetrically across the home. Each column receives one up light. Each tree receives one if prompted in notes. IMPORTANT: Up lights must be on the ground, never on roof/concrete.\n\nPATH LIGHTS: Place post-mounted path lights along both sides of the front walkway leading to the front door spaced approximately 6 to 8 feet apart in a staggered pattern. Place path lights along the driveway edge where it meets landscaping.\n\nCRITICAL RESTRICTIONS: Do not generate any Gutter Mounted Up Lights. Do not generate any soffit lights. Do not generate any downlights mounted on the house. Do not generate any string lights. Do not generate any hanging lights. Do not generate any wall-mounted sconces. Do not generate any step lights. Do not generate any roofline lighting. Do not generate any eave lighting.\n\nThe ONLY fixtures that may appear are ground-mounted up lights aimed upward AND post-mounted path lights aimed downward at the ground. Verify before rendering that every fixture is one of these two types. Remove any fixture that does not match.",
  },
  {
    label: "Up Lights + Gutter Mounted Up Lights",
    text:
      "Generate a landscape lighting design using ONLY two fixture types: ground-mounted up lights AND Gutter Mounted Up Lights. No other fixture types are permitted.\n\nUP LIGHTS: Place ground-mounted up lights at the base of the front facade walls aimed upward to wash light across the brick or stone. Place up lights at the base of each exterior column or pillar aimed upward. Place up lights at the base of prominent trees in the front yard aimed upward into the canopy. Space wall-washing up lights symmetrically across the home. Each column receives one up light. Each tree receives one up light if prompted to do so. IMPORTANT: Up lights must be on the ground, never on roof/concrete.\n\nGUTTER MOUNTED UP LIGHTS: Up light fixtures mounted on the gutter edge/fascia of the first floor shining upwards. These fixtures aim up and wash light up to highlight dormers and the 2nd story home the homes features. Gutter Mounted Up Lights only high features directly above them. Install them along the primary front-facing rooflines directly below the feature.\n\nCRITICAL RESTRICTIONS: Do not generate any path lights. Do not generate any walkway lights. DO not generate soffit lights. Do not generate down lights. Do not generate Eve lights. Do not generate any bollard lights. Do not generate any post-mounted fixtures in the ground. Do not generate any string lights. Do not generate any wall-mounted sconces. Do not generate any step lights. Do not generate any decorative fixtures.\n\nThe ONLY fixtures that may appear are ground-mounted up lights aimed upward AND Gutter Mounted Up Lights aim upwards. Verify before rendering that every fixture is one of these two types. Remove any fixture that does not match.",
  },
  {
    label: "Up Lights + Gutter Mounted Up Lights + Path Lights",
    text:
      "Generate a landscape lighting design using ONLY three fixture types: ground-mounted up lights, Gutter Mounted Up Lights, AND post-mounted path lights. No other fixture types are permitted.\n\nUP LIGHTS: Place ground-mounted up lights at the base of the front facade walls aimed upward to wash light across the brick or stone. Place up lights at the base of each exterior column or pillar aimed upward. Place up lights at the base of prominent trees in the front yard aimed upward into the canopy. Space wall-washing up lights symmetrically across the home. Each column receives one up light. Each tree receives one up light if prompted to do so. IMPORTANT: Up lights must be on the ground, never on roof/concrete.\n\nGUTTER MOUNTED UP LIGHTS: Up light fixtures mounted on the gutter edge/fascia of the first floor shining upwards. These fixtures aim up and wash light up to highlight dormers and the 2nd story home the homes features. Gutter Mounted Up Lights only high features directly above them. Install them along the primary front-facing rooflines directly below the feature.\n\nPATH LIGHTS: Place post-mounted path lights along both sides of the front walkway leading to the front door spaced approximately 6 to 8 feet apart in a staggered pattern. Place path lights along the driveway edge where it meets landscaping.\n\nCRITICAL RESTRICTIONS: Do not generate any string lights. Do not generate any hanging lights. Do not generate any wall-mounted sconces. Do not generate any step lights. Do not generate any decorative lanterns. Do not generate any flood lights. Do not generate any security lights. Do not generate any colored lights unless specified.\n\nThe ONLY fixtures that may appear are ground-mounted up lights, Gutter Mounted Up Lights, and post-mounted path lights. Verify before rendering that every fixture is one of these three types. Remove any fixture that does not match.",
  },
  {
    label: "Christmas Theme",
    text:
      "Create a Christmas-themed lighting design using only two fixture types:\n\nGround-mounted uplights, and\nGutter Mounted Up Lights.\n\nAll uplights must use red and green light only, arranged in a tasteful, professional pattern that feels festive but still high-end. You can alternate red and green fixtures or group them by sections of the house (for example, red on one part of the elevation and green on another), but the overall look should be balanced and intentional, not random or chaotic.\n\nGround-mounted uplights:\nInstall every fixture in the soil or planting beds at ground level, directly in front of the house or key features.\nDo not place any uplight on concrete, steps, porches, driveways, or attached to the house.\nUse these fixtures to wash the lower walls, columns, and architectural elements with red and green beams shining upward, creating a clear holiday feel along the front elevation.\n\nGutter Mounted Up Lights:\nAttach these fixtures directly along the gutter / fascia line at the roof edge.\nEach Gutter Mounted Up Light must clearly appear mounted at that upper edge, never on the ground or floating.\nAim them upward to graze the eaves, peaks, and upper architecture with red and green light, echoing the look of professional Christmas roofline lighting without adding actual string lights.\n\nDo not add any other fixture types—no path lights, step lights, tree-mounted lights, wall sconces, floodlights, or string lights. Do not invent inflatables, projections, or extra decorations. All visible artificial lighting in the scene must clearly come only from these ground-mounted uplights and Gutter Mounted Up Lights, using red and green colors to create a clean, festive Christmas look that still feels professionally designed.",
  },
  {
    label: "Halloween Theme",
    text:
      "Create a Halloween-themed lighting design using only two fixture types:\n\nGround-mounted uplights, and\nGutter Mounted Up Lights.\n\nAll uplights must use orange and purple light only, arranged in a tasteful, spooky yet professional pattern. You can alternate orange and purple fixtures or group them by sections of the house (for example, orange on one part of the elevation and purple on another), but the overall look should be balanced and intentional.\n\nGround-mounted uplights:\nInstall every fixture in the soil or planting beds at ground level, directly in front of the house or key features.\nDo not place any uplight on concrete, steps, porches, driveways, or attached to the house.\nUse these fixtures to wash the lower walls, columns, and architectural elements with orange and purple beams shining upward, creating a hauntingly beautiful feel along the front elevation.\n\nGutter Mounted Up Lights:\nAttach these fixtures directly along the gutter / fascia line at the roof edge.\nEach Gutter Mounted Up Light must clearly appear mounted at that upper edge, never on the ground or floating.\nAim them upward to graze the eaves, peaks, and upper architecture with orange and purple light, echoing the look of professional holiday lighting.\n\nDo not add any other fixture types—no path lights, step lights, tree-mounted lights, wall sconces, floodlights, or string lights. Do not invent inflatables, projections, or extra decorations. All visible artificial lighting in the scene must clearly come only from these ground-mounted uplights and Gutter Mounted Up Lights, using orange and purple colors to create a clean, Halloween look that still feels professionally designed.",
  },
];

export const DEFAULT_PRICING: FixturePricing[] = [
  {
    id: "default_up",
    fixtureType: "up",
    name: "Solid Cast Brass Up Light: COMPLETELY INSTALLED PRICE",
    description:
      "Color: Light Bronze OR Gun Metal Black\nLIFETIME product warranty on the fixture\n1 Year product warranty on LED Bulb: Rated for 30,000 hours\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc ALL included in the fixture price.",
    unitPrice: 175.0,
  },
  {
    id: "default_path",
    fixtureType: "path",
    name: "Cast Brass - Modern Path Light: COMPLETELY INSTALLED PRICE",
    description:
      "Color: Light Bronze OR Gun Metal Black\nLIFETIME warranty on the fixture\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc. Included in the fixture price.",
    unitPrice: 210.0,
  },
  {
    id: "default_gutter",
    fixtureType: "gutter",
    name: "Solid Cast Brass Up Light - Gutter Mounted Up Light: COMPLETELY INSTALLED PRICE",
    description:
      "Color: Light Bronze OR Gun Metal Black\nLIFETIME product warranty on the fixture\n1 Year product warranty on LED Bulb: Rated for 30,000 hours\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc ALL included in the fixture price.",
    unitPrice: 185.0,
  },
  {
    id: "default_transformer",
    fixtureType: "transformer",
    name: "Professional Low Voltage Transformer (300W)",
    description:
      "Stainless Steel Case\nLifetime Warranty\nPhoto Cell / Timer included\nInstalled with dedicated circuit connection.",
    unitPrice: 350.0,
  },
];