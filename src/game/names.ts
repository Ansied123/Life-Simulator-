const FIRST_NAMES_M = [
  'James', 'Liam', 'Noah', 'Ethan', 'Mason', 'Lucas', 'Oliver', 'Aiden',
  'William', 'Benjamin', 'Elijah', 'Henry', 'Alexander', 'Jacob', 'Michael', 'Daniel',
  'Logan', 'Jackson', 'Sebastian', 'Jack', 'Owen', 'Samuel', 'Matthew', 'Joseph',
  'Levi', 'Mateo', 'David', 'John', 'Wyatt', 'Carter', 'Julian', 'Luke',
  'Grayson', 'Isaac', 'Jayden', 'Theodore', 'Gabriel', 'Anthony', 'Dylan', 'Leo',
  'Lincoln', 'Jaxon', 'Asher', 'Christopher', 'Josiah', 'Andrew', 'Thomas', 'Joshua',
  'Ezra', 'Hudson', 'Charles', 'Caleb', 'Isaiah', 'Ryan', 'Nathan', 'Adrian',
  'Christian', 'Maverick', 'Colton', 'Elias', 'Aaron', 'Eli', 'Landon', 'Jonathan',
  'Nolan', 'Hunter', 'Cameron', 'Connor', 'Santiago', 'Jeremiah', 'Ezekiel', 'Angel',
  'Roman', 'Easton', 'Miles', 'Robert', 'Jameson', 'Ian', 'Greyson', 'Adam',
  'Wesley', 'Brayden', 'Carson', 'Jordan', 'Xavier', 'Jaxson', 'Tobias', 'Bennett',
  'Silas', 'Kevin', 'Cooper', 'Jose', 'Austin', 'Parker', 'Blake', 'Bryson',
  'Damian', 'Brandon', 'Axel', 'Juan', 'Declan', 'Kai', 'Beau', 'August',
  'Weston', 'Rowan', 'Vincent', 'Marcus', 'Tyler', 'Cole', 'Dominic', 'Felix',
  'Gavin', 'Harrison', 'Jasper', 'Justin',
];
const FIRST_NAMES_F = [
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Amelia', 'Harper',
  'Charlotte', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Avery', 'Mila', 'Ella',
  'Scarlett', 'Grace', 'Chloe', 'Camila', 'Penelope', 'Riley', 'Layla', 'Lillian',
  'Nora', 'Zoey', 'Mary', 'Lily', 'Eleanor', 'Hannah', 'Lucy', 'Aria',
  'Aurora', 'Addison', 'Stella', 'Natalie', 'Zoe', 'Leah', 'Hazel', 'Violet',
  'Aubrey', 'Savannah', 'Audrey', 'Brooklyn', 'Bella', 'Claire', 'Skylar', 'Paisley',
  'Everly', 'Anna', 'Caroline', 'Nova', 'Genesis', 'Emilia', 'Kennedy', 'Samantha',
  'Maya', 'Willow', 'Kinsley', 'Naomi', 'Sarah', 'Allison', 'Gabriella', 'Madelyn',
  'Cora', 'Ruby', 'Eva', 'Serenity', 'Autumn', 'Adeline', 'Hailey', 'Gianna',
  'Valentina', 'Isla', 'Eliana', 'Quinn', 'Nevaeh', 'Ivy', 'Sadie', 'Piper',
  'Lydia', 'Alexa', 'Josephine', 'Emery', 'Julia', 'Delilah', 'Madison', 'Ariana',
  'Vivian', 'Ryleigh', 'Jade', 'Adalynn', 'Rylee', 'Brielle', 'Aaliyah', 'Melanie',
  'Alice', 'Athena', 'Margaret', 'Norah', 'Lyla', 'Iris', 'Olive', 'Lucia',
  'Alaina', 'Reagan', 'Raelynn', 'Sophie', 'Esther', 'Mackenzie',
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell',
  'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomGender(): 'male' | 'female' {
  return Math.random() < 0.5 ? 'male' : 'female';
}

export function randomFirstName(gender: 'male' | 'female'): string {
  return pick(gender === 'male' ? FIRST_NAMES_M : FIRST_NAMES_F);
}

export function randomLastName(): string {
  return pick(LAST_NAMES);
}
