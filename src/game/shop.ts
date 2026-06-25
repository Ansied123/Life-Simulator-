export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  description: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'candy_bar', name: 'Candy Bar', icon: '🍫', price: 2, description: 'A quick sugary snack.' },
  { id: 'headphones', name: 'Headphones', icon: '🎧', price: 45, description: 'Decent sound, fits in a pocket.' },
  { id: 'sneakers', name: 'Sneakers', icon: '👟', price: 90, description: 'Comfortable everyday shoes.' },
  { id: 'skateboard', name: 'Skateboard', icon: '🛹', price: 80, description: 'For getting around in style.' },
  { id: 'backpack', name: 'Backpack', icon: '🎒', price: 50, description: 'Holds your stuff.' },
  { id: 'video_game', name: 'Video Game', icon: '🎮', price: 60, description: 'The latest release.' },
  { id: 'bicycle', name: 'Bicycle', icon: '🚲', price: 220, description: 'Two wheels, zero gas.' },
  { id: 'wristwatch', name: 'Wristwatch', icon: '⌚', price: 250, description: 'Tells time, looks sharp.' },
  { id: 'smartphone', name: 'Smartphone', icon: '📱', price: 850, description: 'The newest model.' },
  { id: 'laptop', name: 'Laptop', icon: '💻', price: 1200, description: 'For work, school, or play.' },
];
