








# Supabase setup (Mercado Arcano)

1. Crea un proyecto en Supabase.
2. En el SQL editor, ejecuta `supabase/schema.sql`.
3. Copia URL + anon key del proyecto.
4. Configura `index.html`:

```html
<meta name="supabase-url" content="https://TU-PROYECTO.supabase.co" />
<meta name="supabase-anon-key" content="TU_ANON_KEY" />
```

También puedes setearlo por runtime:

```js
window.__SUPABASE_URL__ = 'https://TU-PROYECTO.supabase.co';
window.__SUPABASE_ANON_KEY__ = 'TU_ANON_KEY';
```

## Qué persiste

- `players.gold`
- `inventory` por `player_id`
- `market` (`item_id`, `price`, `stock`)

## RPC usadas por el frontend

- `replace_inventory(p_player_id, p_items)`
- `add_inventory_item(p_player_id, p_item_id, p_quantity)`
- `update_player_gold(p_player_id, p_amount)`
