(function () {
  "use strict";

  /** @typedef {{ id: string, categoria: string, codigo: string, color: number, nombre: string, descripcion: string, precio: number | null, detalles: string, imagen: string | null }} Item */

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
  const modalTitle = document.getElementById("modal-title");
  const modalCategoria = document.getElementById("modal-categoria");
  const modalCodigo = document.getElementById("modal-codigo");
  const modalColor = document.getElementById("modal-color");
  const modalPrecio = document.getElementById("modal-precio");
  const modalDescripcion = document.getElementById("modal-descripcion");
  const modalDetalles = document.getElementById("modal-detalles");

  let activeFilter = "todas";

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
      btn.setAttribute("aria-label", "Ver detalle de " + item.nombre);

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

  function openModal(item) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    modalCategoria.textContent = item.categoria;
    modalTitle.textContent = item.nombre;
    modalCodigo.textContent = item.codigo;
    modalColor.textContent = String(item.color);
    modalDescripcion.textContent = item.descripcion;
    modalDetalles.textContent = item.detalles;

    if (item.precio != null && item.precio !== "") {
      modalPrecio.textContent =
        "Precio: " + precioFmt.format(Number(item.precio));
    } else {
      modalPrecio.textContent = "Precio: consultar en tienda";
    }

    const mediaParent = modalImg.parentElement;
    const existingPh = mediaParent.querySelector(".modal__placeholder-wrap");
    if (existingPh) existingPh.remove();

    modalImg.onload = null;
    modalImg.onerror = null;

    if (item.imagen) {
      modalImg.hidden = false;
      modalImg.alt = item.nombre;
      modalImg.src = encodePath(item.imagen);
      modalImg.onerror = function () {
        modalImg.hidden = true;
        modalImg.removeAttribute("src");
        const ph = document.createElement("div");
        ph.className = "modal__placeholder-wrap";
        ph.setAttribute("aria-hidden", "true");
        ph.textContent = "🧶";
        mediaParent.appendChild(ph);
      };
    } else {
      modalImg.hidden = true;
      modalImg.removeAttribute("src");
      modalImg.removeAttribute("alt");
      const ph = document.createElement("div");
      ph.className = "modal__placeholder-wrap";
      ph.setAttribute("aria-hidden", "true");
      ph.textContent = "🧶";
      mediaParent.appendChild(ph);
    }

    modal.querySelector(".modal__close").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  if (!data.length) {
    resultsCount.textContent = "No hay datos. Ejecutá npm run build:data en catalogo-app.";
  } else {
    renderChips();
    renderGrid();
  }
})();
