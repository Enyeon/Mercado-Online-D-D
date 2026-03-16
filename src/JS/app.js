








/* =========================
   JUGADOR
========================= */

const Player = {
   money: 0,
   inventory: {}
};


/* =========================
   ESTADO DEL MERCADO
========================= */

const MarketState = {
   mode: "buy",
   piso: "all",
   view: "market" // market | inventory
};


/* =========================
   SISTEMA MONETARIO
========================= */

const Currency = {
   current:"dnd",

   systems: {
      dnd: { symbol: "GP", rate: 1 },
      lord: { symbol: "Census", rate: 10 }
   },

   convert(value) {
      const s = this.systems[this.current];
      return (value * s.rate).toFixed(2) + " " + s.symbol;
   }
};


/* =========================
   UTILIDADES
========================= */

function generatepisos(){
   const select = document.getElementById("piso-select");

   for(let i = 1; i <= 100; i++){
      const opt = document.createElement("option");

      opt.value = i;
      opt.textContent = "Piso " + i;

      select.appendChild(opt);
   }
}

function getItemsBypiso(piso){
   if(piso === "all") return MarketData.items;
   return MarketData.items.filter(i=>i.piso==piso);
}

function searchItems(list,term){
   term = term.toLowerCase();
   return list.filter(i => i.name.toLowerCase().includes(term));
}

function updateMarket() {
   if(MarketState.mode === "buy"){
      renderBuyView();
   }

   if(MarketState.mode === "sell"){
      renderSellView();
   }
}


/* =========================
   RENDER INVENTARIO
========================= */

function renderInventoryView() {
   const container = document.getElementById("item-list");
   container.innerHTML = "";

   if(Object.keys(Player.inventory).length === 0) {
      container.innerHTML = "<p>Inventario vacío</p>";
      return;
   }

   Object.entries(Player.inventory).forEach(([id, qty]) => {
      const item = MarketData.items.find(i => i.id == id);
      const div = document.createElement("div");

      div.className="item";
      div.innerHTML=`
         ${item.name} (x${qty})
      `;
      div.onclick = () => UI.showItem(item);

      container.appendChild(div);
   });
}


/* =========================
   RENDER MERCADO
========================= */

function renderBuyView() {
   let items = getItemsBypiso(MarketState.piso);
   const search = document.getElementById("search").value;

   if(search) {
      items = searchItems(items,search);
   }

   UI.renderItems(items);
}

function renderSellView() {
   const container = document.getElementById("item-list");
   container.innerHTML = "";
   Object.entries(Player.inventory).forEach(([id, qty]) => {
      const item = MarketData.items.find(i => i.id == id);
      const div = document.createElement("div");
      div.className = "item";
      div.innerText = `${item.name} (x${qty})`;
      div.onclick = () => UI.showItem(item);
      container.appendChild(div);
   });
}


/* =========================
   UI
========================= */

const UI = {
   renderMoney() {
      document.getElementById("player-money").innerText = Currency.convert(Player.money);
   },

   renderItems(items) {
      const container = document.getElementById("item-list");
      container.innerHTML = "";
      items.forEach(item => {
         const div = document.createElement("div");
         div.className = "item";
         div.innerText = item.name;
         div.onclick = () => UI.showItem(item);
         container.appendChild(div);
      });
   },


   showItem(item) {
      const panel = document.getElementById("item-detail");

      if (MarketState.mode === "buy") {
         let vendorsHTML = "";
         item.vendors.forEach((v, i) => {
            vendorsHTML+=`
               <div class="vendor">
                  ${v.name} - ${Currency.convert(v.price)} (x${v.stock})
                  <button onclick="Market.buy(${item.id},${i})">Comprar</button>
               </div>
            `;
         });
         panel.innerHTML=`
            <h2>${item.name}</h2>
            <p>${item.description}</p>
            <p>Valor mercado: ${Currency.convert(item.marketValue)}</p>
            <h3>Vendedores</h3>
            ${vendorsHTML}
         `;
      }

      if(MarketState.mode === "sell") {
         panel.innerHTML=`
            <h2>${item.name}</h2>
            <p>${item.description}</p>
            <p>Valor mercado: ${Currency.convert(item.marketValue)}</p>
            <h3>Vender</h3>
            <input id="sell-qty" type="number" placeholder="Cantidad">
            <input id="sell-price" type="number" placeholder="Precio">
            <button onclick="Market.sell(${item.id})">Vender</button>
         `;
      }
   }
};



/* =========================
   MERCADO
========================= */

const Market = {
   buy(itemId,vendorIndex) {
      const item = MarketData.items.find(i => i.id === itemId);
      const vendor = item.vendors[vendorIndex];
      const qty = parseInt(prompt("Cantidad a comprar"));
      if(!qty) return;
      const total = qty * vendor.price;
      if(Player.money < total) {
         alert("No tienes suficiente dinero");
         return;
      }

      if(qty > vendor.stock) {
         alert("No hay suficiente stock");
         return;
      }

      Player.money -= total;
      vendor.stock -= qty;
      Player.inventory[itemId] = (Player.inventory[itemId] || 0) + qty;
      UI.renderMoney();
      updateMarket();
      alert("Compra realizada");
   },

   sell(itemId) {
      const qty = parseInt(document.getElementById("sell-qty").value);
      const price = parseFloat(document.getElementById("sell-price").value);

      if(!qty || !price) {
         alert("Datos inválidos");
         return;
      }

      if(Player.inventory[itemId] < qty) {
         alert("No tienes suficientes objetos");
         return;
      }

      const item = MarketData.items.find(i => i.id === itemId);
      if(price > item.marketValue * 2) {
         alert("El precio es muy alto. Es posible que nadie lo compre.");
      }

      const total = qty * price;
      Player.money += total;
      Player.inventory[itemId] -= qty;

      if(Player.inventory[itemId] <= 0) {
         delete Player.inventory[itemId];
      }

      UI.renderMoney();
      updateMarket();
      alert("Venta realizada");
   }
};



/* =========================
   EVENTOS
========================= */

document.getElementById("piso-select").addEventListener("change", (e) => {
   MarketState.piso = e.target.value;
   updateMarket();
});

document.getElementById("search").addEventListener("input", () => {
   updateMarket();
});

document.getElementById("currency-system").addEventListener("change", e => {
   Currency.current = e.target.value;
   UI.renderMoney();
});

document.getElementById("mode-buy").onclick = () => {
   MarketState.mode = "buy";
   updateMarket();
};

document.getElementById("mode-sell").onclick = () => {
   MarketState.mode = "sell";
   updateMarket();
};

document.getElementById("view-inventory").onclick = () => {
   if(MarketState.view === "market"){
      MarketState.view = "inventory";
      renderInventoryView();
   } else {
      MarketState.view = "market";
      updateMarket();
   }
};


/* =========================
   INICIO
========================= */

generatepisos();
UI.renderMoney();
updateMarket();
