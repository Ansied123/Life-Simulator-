const FIRST_NAMES_M = ['James', 'Liam', 'Noah', 'Ethan', 'Mason', 'Lucas', 'Oliver', 'Aiden'];
const FIRST_NAMES_F = ['Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Amelia', 'Harper'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

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
