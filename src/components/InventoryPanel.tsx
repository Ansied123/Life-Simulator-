import type { Item } from '../game/types';

export function InventoryPanel({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="death-note">Your inventory is empty.</p>;
  }

  return (
    <div className="inventory-list">
      {items.map((item, i) => (
        <div key={`${item.id}-${i}`} className="inventory-item">
          <span className="inventory-icon">{item.icon}</span>
          <div className="inventory-info">
            <span className="inventory-name">{item.name}</span>
            <span className="inventory-meta">Obtained at age {item.acquiredAge}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
