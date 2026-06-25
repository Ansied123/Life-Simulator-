const DIRECTIONS = ['N', 'S', 'E', 'W', ''];

const STREET_TYPES = ['St', 'Rd', 'Ln', 'Dr', 'Ave', 'Blvd', 'Ct', 'Pl', 'Way', 'Cir', 'Ter', 'Trl'];

// 25 roots x 20 modifiers = 500 distinct two-word street names, plus a
// handful of single-word classics for flavor.
const STREET_ROOTS = [
  'Maple', 'Oak', 'Elm', 'Cedar', 'Pine', 'Birch', 'Willow', 'Magnolia', 'Chestnut', 'Walnut',
  'Cherry', 'Spruce', 'Aspen', 'Juniper', 'Laurel', 'Sunset', 'Sunrise', 'Highland', 'Meadow', 'River',
  'Lake', 'Forest', 'Valley', 'Spring', 'Liberty',
];
const STREET_MODIFIERS = [
  'Ridge', 'Hollow', 'Glen', 'Crossing', 'Bend', 'Grove', 'Terrace', 'Heights', 'Run', 'Trail',
  'Path', 'Hill', 'View', 'Point', 'Field', 'Brook', 'Vale', 'Cove', 'Pass', 'Bluff',
];
const CLASSIC_STREET_NAMES = [
  'Main', 'Washington', 'Lincoln', 'Park', 'Broadway', 'Franklin', 'Jefferson', 'Madison',
  'Monroe', 'Adams', 'Jackson', 'Grant', 'Wilson', 'Harrison',
];

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
  'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStreetName(): string {
  if (Math.random() < 0.1) return pick(CLASSIC_STREET_NAMES);
  return `${pick(STREET_ROOTS)} ${pick(STREET_MODIFIERS)}`;
}

export function generateAddress(): string {
  const houseNumber = Math.floor(Math.random() * 10000);
  const direction = pick(DIRECTIONS);
  const street = `${direction ? `${direction} ` : ''}${randomStreetName()} ${pick(STREET_TYPES)}`;
  const state = pick(STATES);
  return `${houseNumber} ${street}, ${state}, USA`;
}
