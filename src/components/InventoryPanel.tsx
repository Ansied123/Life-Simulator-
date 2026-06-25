import type { Item } from '../game/types';

export function InventoryPanel({ items, onOpenItem }: { items: Item[]; onOpenItem: (item: Item) => void }) {
  if (items.length === 0) {
    return <p className="death-note">Your inventory is empty.</p>;
  }

  return (
    <div className="inventory-list">
      {items.map((item, i) => {
        const clickable = !!item.progressReport;
        return (
          <div
            key={`${item.id}-${i}`}
            className={`inventory-item ${clickable ? 'inventory-item-clickable' : ''}`}
            onClick={clickable ? () => onOpenItem(item) : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
          >
            <span className="inventory-icon">{item.icon}</span>
            <div className="inventory-info">
              <span className="inventory-name">{item.name}</span>
              {item.description && <span className="inventory-desc">{item.description}</span>}
              <span className="inventory-meta">Obtained at age {item.acquiredAge}</span>
            </div>
            {clickable && <span className="inventory-chevron">›</span>}
          </div>
        );
      })}
    </div>
  );
}
