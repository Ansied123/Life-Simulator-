# LIFE FILE — a BitLife-style life simulator

A text-driven life simulator built with React + TypeScript + Vite.
Create a character, age up one year at a time, make choices, and see
how the life turns out.

## Run it

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

## Build for production

```bash
npm run build      # outputs static files to /dist
npm run preview    # serve the production build locally
```

## How it's organized

```
src/
├── game/
│   ├── types.ts          Character & event data models
│   ├── character.ts      Character creation + stat math
│   ├── engine.ts         Aging, stat drift, death rolls
│   ├── save.ts           localStorage save/load
│   └── events/
│       ├── index.ts      Event pool + weighted picker
│       ├── childhood.ts  Events for ages 0–12
│       ├── teen.ts       Events for ages 13–17
│       └── adult.ts      Events for ages 18+
├── components/           Presentational UI pieces
├── store.ts              useGame() hook = the game loop
└── App.tsx               Screens + layout
```

## Add a new event

Open the right age file in `src/game/events/` and append an object:

```ts
{
  id: 'unique_id',
  once: true,                    // optional: fire at most once per life
  weight: 1,                     // optional: relative likelihood
  condition: (c) => c.age >= 25, // when is it eligible?
  text: () => 'Something happens. What do you do?',
  choices: [
    { text: 'Option A', effects: { happiness: 5, money: 100, log: 'Chose A.' } },
    { text: 'Option B', effects: { health: -3 } },
  ],
}
```

No engine changes needed — the picker reads from the pool automatically.

## Ideas to build next

- Relationships (family, partners, friends) as their own entities
- A dedicated careers system with salary progression
- Activities menu each year (gym, study, crime) instead of only random events
- Assets: buy houses, cars; track net worth
- Multiple save slots
- A backend (accounts, cloud saves, leaderboards) once the core is solid
