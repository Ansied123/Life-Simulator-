import { SHOP_ITEMS } from '../game/shop';
import type { ShopItem } from '../game/shop';

export function ShopPanel({ money, onBuy }: { money: number; onBuy: (item: ShopItem) => void }) {
  return (
    <div className="shop-list">
      {SHOP_ITEMS.map((item) => (
        <div key={item.id} className="shop-item">
          <span className="shop-icon">{item.icon}</span>
          <div className="shop-info">
            <span className="shop-name">{item.name}</span>
            <span className="shop-desc">{item.description}</span>
          </div>
          <button
            className="secondary-btn shop-buy-btn"
            disabled={money < item.price}
            onClick={() => onBuy(item)}
          >
            ${item.price.toLocaleString()}
          </button>
        </div>
      ))}
    </div>
  );
}
