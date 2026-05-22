(function () {
  "use strict";

  /** @typedef {{ id: string, categoria: string, codigo: string, color: number, nombre: string, descripcion: string, precio: number | null, detalles: string, imagen: string | null, imagenSwatch?: string | null }} Item */

  /** @type {Item[]} */
  const data = window.CATALOGO_DATA || [];

  const precioFmt = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const grid = document.getElementById("catalog-grid");
  const chipsEl = document.getElementById("filter-chips");
  const resultsCount = document.getElementById("results-count");
  const modal = document.getElementById("detail-modal");

  const modalImg = document.getElementById("modal-img");
  const modalMedia = document.getElementById("modal-media");
  const modalThumbs = document.getElementById("modal-thumbs");
  const modalSwatches = document.getElementById("modal-swatches");
  const modalTitle = document.getElementById("modal-title");
  const modalCodigo = document.getElementById("modal-codigo");
  const modalColorLabel = document.getElementById("modal-color-label");
  const modalPrecio = document.getElementById("modal-precio");
  const modalDetalles = document.getElementById("modal-detalles");

  let activeFilter = "todas";
  /** @type {Item[]} */
  let modalVariants = [];
  /** @type {Item | null} */
  let modalActive = null;

  function encodePath(rel) {
    return rel
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
  }

  function uniqueCategories() {
    const set = new Set();
    data.forEach((d) => set.add(d.categoria));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }

  function filtered() {
    if (activeFilter === "todas") return data;
    return data.filter((d) => d.categoria === activeFilter);
  }

  function variantsForCategory(categoria) {
    return data
      .filter((d) => d.categoria === categoria)
      .sort((a, b) => a.color - b.color || a.nombre.localeCompare(b.nombre, "es"));
  }

  function colorLabel(item) {
    return "Color — " + item.color + " — " + item.nombre;
  }

  function formatPrecio(item) {
    if (item.precio != null && item.precio !== "") {
      return precioFmt.format(Number(item.precio));
    }
    return "Consultar en tienda";
  }

  function renderChips() {
    const cats = uniqueCategories();
    chipsEl.innerHTML = "";

    function addChip(value, label, active) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (active ? " chip--active" : "");
      btn.textContent = label;
      btn.dataset.filter = value;
      btn.addEventListener("click", () => {
        activeFilter = value;
        renderChips();
        renderGrid();
      });
      chipsEl.appendChild(btn);
    }

    addChip("todas", "Todas", activeFilter === "todas");
    cats.forEach((c) => addChip(c, c, activeFilter === c));
  }

  function renderGrid() {
    const list = filtered();
    resultsCount.textContent =
      list.length === 1
        ? "1 producto"
        : list.length + " productos";

    grid.innerHTML = "";

    list.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.setAttribute("aria-label", "Ver " + item.categoria + " — " + item.nombre);

      const media = document.createElement("div");
      media.className = "card__media";

      if (item.imagen) {
        const img = document.createElement("img");
        img.className = "card__img";
        img.alt = item.nombre + " — " + item.categoria;
        img.loading = "lazy";
        img.src = encodePath(item.imagen);
        img.onerror = function () {
          img.remove();
          media.appendChild(placeholderEl());
        };
        media.appendChild(img);
      } else {
        media.appendChild(placeholderEl());
      }

      const body = document.createElement("div");
      body.className = "card__body";

      const badge = document.createElement("p");
      badge.className = "card__badge";
      badge.textContent = item.categoria;

      const name = document.createElement("h2");
      name.className = "card__name";
      name.textContent = item.nombre;

      const meta = document.createElement("p");
      meta.className = "card__meta";
      meta.textContent = item.codigo + " · Color " + item.color;

      body.appendChild(badge);
      body.appendChild(name);
      body.appendChild(meta);

      btn.appendChild(media);
      btn.appendChild(body);
      btn.addEventListener("click", () => openModal(item));

      grid.appendChild(btn);
    });
  }

  function placeholderEl() {
    const span = document.createElement("span");
    span.className = "card__placeholder";
    span.setAttribute("aria-hidden", "true");
    span.textContent = "🧶";
    return span;
  }

  function clearMedia() {
    const ph = modalMedia.querySelector(".modal__placeholder-wrap");
    if (ph) ph.remove();
    modalImg.onload = null;
    modalImg.onerror = null;
    modalImg.hidden = true;
    modalImg.removeAttribute("src");
    modalImg.removeAttribute("alt");
  }

  function setMainImage(item) {
    clearMedia();
    if (!item.imagen) {
      const wrap = document.createElement("div");
      wrap.className = "modal__placeholder-wrap";
      wrap.setAttribute("aria-hidden", "true");
      wrap.textContent = "🧶";
      modalMedia.appendChild(wrap);
      return;
    }

    modalImg.hidden = false;
    modalImg.alt = item.categoria + " — " + item.nombre;
    modalImg.src = encodePath(item.imagen);
    modalImg.onerror = function () {
      modalImg.hidden = true;
      modalImg.removeAttribute("src");
      const wrap = document.createElement("div");
      wrap.className = "modal__placeholder-wrap";
      wrap.setAttribute("aria-hidden", "true");
      wrap.textContent = "🧶";
      modalMedia.appendChild(wrap);
    };
  }

  function pickerImage(item, kind) {
    if (kind === "swatch" && item.imagenSwatch) return item.imagenSwatch;
    return item.imagen;
  }

  function makePickerButton(item, kind) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "color-picker color-picker--" +
      kind +
      (modalActive && modalActive.id === item.id ? " color-picker--active" : "");
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", modalActive && modalActive.id === item.id ? "true" : "false");
    btn.setAttribute("aria-label", item.nombre + ", color " + item.color);
    btn.title = item.nombre;

    const imgPath = pickerImage(item, kind);
    if (imgPath) {
      const img = document.createElement("img");
      img.className = "color-picker__img";
      img.alt = "";
      img.src = encodePath(imgPath);
      img.loading = "lazy";
      btn.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.className = "color-picker__fallback";
      span.textContent = String(item.color);
      btn.appendChild(span);
    }

    btn.addEventListener("click", () => selectVariant(item));
    return btn;
  }

  function renderPickers() {
    if (modalThumbs) modalThumbs.innerHTML = "";
    modalSwatches.innerHTML = "";

    if (modalThumbs) {
      modalVariants.forEach((item) => {
        modalThumbs.appendChild(makePickerButton(item, "thumb"));
      });
    }

    modalVariants.forEach((item) => {
      modalSwatches.appendChild(makePickerButton(item, "swatch"));
    });
  }

  function selectVariant(item) {
    modalActive = item;
    modalTitle.textContent = item.categoria;
    modalCodigo.textContent = item.codigo;
    modalColorLabel.textContent = colorLabel(item);
    modalPrecio.textContent = formatPrecio(item);
    modalDetalles.textContent = item.detalles || "Sin información adicional.";

    setMainImage(item);
    renderPickers();
  }

  function openModal(item) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    modalVariants = variantsForCategory(item.categoria);
    selectVariant(
      modalVariants.find((v) => v.id === item.id) || modalVariants[0] || item
    );

    modal.querySelector(".modal__close").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    modalVariants = [];
    modalActive = null;
  }

  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  if (!data.length) {
    resultsCount.textContent =
      "No hay datos. Ejecutá npm run build:data en catalogo-app.";
  } else {
    renderChips();
    renderGrid();
  }
})();
