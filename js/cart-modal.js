/* Shared Add-to-Cart modal: quantity + colour */
(function () {
  const COLORS = [
    { id: "black", label: "Black", hex: "#0a0a0a", border: "#555" },
    { id: "white", label: "White", hex: "#f5f5f5", border: "#ccc" },
    { id: "dark-blue", label: "Dark Blue", hex: "#1a2744", border: "#3a5080" }
  ];

  let pending = null; // { id, name, price, img }

  function ensureModal() {
    if (document.getElementById("cartModal")) return;

    const el = document.createElement("div");
    el.id = "cartModal";
    el.innerHTML = `
      <div class="cm-backdrop" id="cmBackdrop"></div>
      <div class="cm-sheet" role="dialog" aria-modal="true">
        <button type="button" class="cm-close" id="cmClose" aria-label="Close">✕</button>
        <div class="cm-product">
          <img id="cmImg" src="" alt="">
          <div>
            <h3 id="cmName"></h3>
            <p class="cm-price" id="cmPrice"></p>
          </div>
        </div>

        <p class="cm-label">Colour</p>
        <div class="cm-colors" id="cmColors"></div>

        <p class="cm-label">Quantity</p>
        <div class="cm-qty">
          <button type="button" id="cmMinus" aria-label="Decrease">−</button>
          <span id="cmQty">1</span>
          <button type="button" id="cmPlus" aria-label="Increase">+</button>
        </div>

        <button type="button" class="cm-confirm" id="cmConfirm">Add to Cart</button>
      </div>
    `;
    document.body.appendChild(el);

    const style = document.createElement("style");
    style.textContent = `
      #cartModal {
        display: none; position: fixed; inset: 0; z-index: 9999;
        align-items: flex-end; justify-content: center;
      }
      #cartModal.open { display: flex; }
      .cm-backdrop {
        position: absolute; inset: 0; background: rgba(0,0,0,0.65);
        backdrop-filter: blur(4px);
      }
      .cm-sheet {
        position: relative; width: 100%; max-width: 420px;
        background: #141414; border-radius: 20px 20px 0 0;
        padding: 24px 20px 28px; border: 1px solid #333; border-bottom: none;
        animation: cmUp 0.25s ease;
      }
      @keyframes cmUp {
        from { transform: translateY(40px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .cm-close {
        position: absolute; top: 14px; right: 14px;
        background: none; border: none; color: #aaa; font-size: 1.2rem;
        cursor: pointer; padding: 6px;
      }
      .cm-product {
        display: flex; gap: 14px; align-items: center; margin-bottom: 22px;
        padding-right: 28px;
      }
      .cm-product img {
        width: 72px; height: 72px; object-fit: cover; border-radius: 10px;
        background: #222;
      }
      .cm-product h3 { font-size: 1.05rem; font-weight: 500; margin-bottom: 4px; }
      .cm-price { font-size: 1.15rem; font-weight: 600; }
      .cm-label {
        font-size: 0.8rem; opacity: 0.55; text-transform: uppercase;
        letter-spacing: 1px; margin-bottom: 10px;
      }
      .cm-colors { display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
      .cm-swatch {
        width: 40px; height: 40px; border-radius: 50%; border: 2px solid transparent;
        cursor: pointer; padding: 0; position: relative;
      }
      .cm-swatch.selected { border-color: #fff; box-shadow: 0 0 0 2px #000; }
      .cm-swatch-label {
        position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);
        font-size: 0.65rem; white-space: nowrap; opacity: 0.7;
      }
      .cm-colors { margin-bottom: 32px; }
      .cm-qty {
        display: flex; align-items: center; gap: 0; margin-bottom: 24px;
        background: #1f1f1f; border-radius: 50px; width: fit-content;
        border: 1px solid #333;
      }
      .cm-qty button {
        width: 44px; height: 44px; border: none; background: transparent;
        color: white; font-size: 1.3rem; cursor: pointer;
      }
      .cm-qty span {
        min-width: 36px; text-align: center; font-weight: 600; font-size: 1.05rem;
      }
      .cm-confirm {
        width: 100%; padding: 15px; background: white; color: black;
        border: none; border-radius: 50px; font-size: 1.05rem; font-weight: 600;
        cursor: pointer; font-family: inherit;
      }
      .cm-confirm:active { transform: scale(0.98); }
      @media (min-width: 600px) {
        #cartModal { align-items: center; }
        .cm-sheet {
          border-radius: 16px; border: 1px solid #333;
          margin: 16px;
        }
      }
    `;
    document.head.appendChild(style);

    // Build colour swatches
    const colorsEl = document.getElementById("cmColors");
    COLORS.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cm-swatch" + (i === 0 ? " selected" : "");
      btn.dataset.color = c.id;
      btn.style.background = c.hex;
      btn.style.borderColor = i === 0 ? "#fff" : c.border;
      btn.innerHTML = `<span class="cm-swatch-label">${c.label}</span>`;
      btn.addEventListener("click", () => {
        colorsEl.querySelectorAll(".cm-swatch").forEach((s) => {
          s.classList.remove("selected");
          const col = COLORS.find((x) => x.id === s.dataset.color);
          s.style.borderColor = col ? col.border : "#555";
        });
        btn.classList.add("selected");
        btn.style.borderColor = "#fff";
      });
      colorsEl.appendChild(btn);
    });

    let qty = 1;
    const qtyEl = document.getElementById("cmQty");

    document.getElementById("cmMinus").addEventListener("click", () => {
      if (qty > 1) {
        qty--;
        qtyEl.textContent = qty;
      }
    });
    document.getElementById("cmPlus").addEventListener("click", () => {
      if (qty < 20) {
        qty++;
        qtyEl.textContent = qty;
      }
    });

    function close() {
      document.getElementById("cartModal").classList.remove("open");
      pending = null;
      qty = 1;
      qtyEl.textContent = "1";
    }

    document.getElementById("cmBackdrop").addEventListener("click", close);
    document.getElementById("cmClose").addEventListener("click", close);

    document.getElementById("cmConfirm").addEventListener("click", () => {
      if (!pending) return;
      const selected = colorsEl.querySelector(".cm-swatch.selected");
      const colorId = selected ? selected.dataset.color : "black";
      const colorLabel = (COLORS.find((c) => c.id === colorId) || COLORS[0]).label;

      const cart = JSON.parse(localStorage.getItem("habibiCart") || "[]");

      // Merge if same product + same colour already in cart
      const existing = cart.find(
        (i) => i.id === pending.id && i.color === colorLabel
      );
      if (existing) {
        existing.qty = (existing.qty || 1) + qty;
      } else {
        cart.push({
          id: pending.id,
          name: pending.name,
          price: pending.price,
          img: pending.img,
          color: colorLabel,
          qty: qty
        });
      }

      localStorage.setItem("habibiCart", JSON.stringify(cart));
      close();
      if (typeof window.updateCartCount === "function") window.updateCartCount();
      // brief feedback
      const toast = document.createElement("div");
      toast.textContent = pending.name + " added";
      toast.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#fff;color:#000;padding:12px 24px;border-radius:50px;font-weight:600;z-index:10000;font-size:0.95rem;";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1600);
    });

    // expose open helper reset qty when opening
    window.__openCartModal = function (id, name, price, img) {
      pending = { id, name, price, img };
      qty = 1;
      qtyEl.textContent = "1";
      document.getElementById("cmImg").src = img;
      document.getElementById("cmImg").alt = name;
      document.getElementById("cmName").textContent = name;
      document.getElementById("cmPrice").textContent = "R" + price;
      // reset colour to black
      colorsEl.querySelectorAll(".cm-swatch").forEach((s, i) => {
        s.classList.toggle("selected", i === 0);
        const col = COLORS.find((x) => x.id === s.dataset.color);
        s.style.borderColor = i === 0 ? "#fff" : col.border;
      });
      document.getElementById("cartModal").classList.add("open");
    };
  }

  window.addToCart = function (id, name, price, img) {
    ensureModal();
    window.__openCartModal(id, name, price, img);
  };

  window.updateCartCount = function () {
    const cart = JSON.parse(localStorage.getItem("habibiCart") || "[]");
    const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
    const el = document.getElementById("cart-count");
    if (el) el.textContent = count;
  };

  // auto-init count on pages that have the badge
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      ensureModal();
      window.updateCartCount();
    });
  } else {
    ensureModal();
    window.updateCartCount();
  }
})();
