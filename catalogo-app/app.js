(function () {
  "use strict";

  /** @typedef {{ id: string, categoria: string, codigo: string, color: number, nombre: string, descripcion: string, precio: number | null, detalles: string, imagen: string | null, imagenSwatch?: string | null }} Item */

  /** @typedef {{ categoria: string, variantes: Item[], imagen: string | null, precio: number | null, detalles: string }} CategoriaGrupo */

  /** @type {Item[]} */
  const data = window.CATALOGO_DATA || [];
  /** @type {Record<string, string>} */
  const portadas = window.CATALOGO_PORTADAS || {};

  /** Orden de las categorías principales en el catálogo */
  const CATEGORY_ORDER = [
    "Chenille",
    "Hiper Barata",
    "Super Gruesa",
    "Soft",
    "Macramé",
  ];

  const ZOOM_SCALE = 2.25;

  const precioFmt = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const grid = document.getElementById("catalog-grid");
  const resultsCount = document.getElementById("results-count");
  const modal = document.getElementById("detail-modal");

  const modalImg = document.getElementById("modal-img");
  const modalMedia = document.getElementById("modal-media");
  const modalThumbs = document.getElementById("modal-thumbs");
  const modalSwatches = document.getElementById("modal-swatches");
  const modalCategoria = document.getElementById("modal-categoria");
  const modalTitle = document.getElementById("modal-title");
  const modalDescripcion = document.getElementById("modal-descripcion");
  const modalCodigo = document.getElementById("modal-codigo");
  const modalColorLabel = document.getElementById("modal-color-label");
  const modalPrecio = document.getElementById("modal-precio");
  const modalDetalles = document.getElementById("modal-detalles");

  /** @type {CategoriaGrupo[]} */
  let categorias = [];
  /** @type {Item[]} */
  let modalVariants = [];
  /** @type {Item | null} */
  let modalActive = null;
  /** @type {CategoriaGrupo | null} */
  let modalGrupo = null;

  function encodePath(rel) {
    return rel
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
  }

  function sortIndex(categoria) {
    const i = CATEGORY_ORDER.indexOf(categoria);
    return i === -1 ? CATEGORY_ORDER.length : i;
  }

  /** @returns {CategoriaGrupo[]} */
  function buildCategorias() {
    const map = new Map();

    data.forEach((item) => {
      if (!map.has(item.categoria)) {
        map.set(item.categoria, []);
      }
      map.get(item.categoria).push(item);
    });

    return Array.from(map.entries())
      .map(([categoria, variantes]) => {
        const sorted = variantes.sort(
          (a, b) => a.color - b.color || a.nombre.localeCompare(b.nombre, "es")
        );
        const cover = sorted.find((v) => v.imagen) || sorted[0];
        const ref = sorted[0];
        return {
          categoria,
          variantes: sorted,
          imagen: portadas[categoria] ?? cover?.imagen ?? null,
          precio: ref.precio ?? null,
          detalles: ref.detalles || "",
        };
      })
      .sort((a, b) => sortIndex(a.categoria) - sortIndex(b.categoria));
  }

  function formatPrecio(precio) {
    if (precio != null && precio !== "") {
      return precioFmt.format(Number(precio));
    }
    return "Consultar en tienda";
  }

  function colorCountLabel(n) {
    if (n === 1) return "1 color disponible";
    return n + " colores disponibles";
  }

  function renderGrid() {
    grid.innerHTML = "";

    const n = categorias.length;
    resultsCount.textContent =
      n === 0
        ? "Sin categorías"
        : n === 1
          ? "1 tipo de lana"
          : n + " tipos de lana";

    categorias.forEach((grupo) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card card--categoria";
      btn.setAttribute("aria-label", "Ver " + grupo.categoria);

      const media = document.createElement("div");
      media.className = "card__media";

      if (grupo.imagen) {
        const img = document.createElement("img");
        img.className = "card__img";
        img.alt = grupo.categoria;
        img.loading = "lazy";
        img.src = encodePath(grupo.imagen);
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

      const name = document.createElement("h2");
      name.className = "card__name";
      name.textContent = grupo.categoria;

      const meta = document.createElement("p");
      meta.className = "card__meta";
      meta.textContent = colorCountLabel(grupo.variantes.length);

      const precio = document.createElement("p");
      precio.className = "card__precio";
      precio.textContent = formatPrecio(grupo.precio);

      body.appendChild(name);
      body.appendChild(meta);
      body.appendChild(precio);

      btn.appendChild(media);
      btn.appendChild(body);
      btn.addEventListener("click", () => openModal(grupo));

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

  function resetImageZoom() {
    modalMedia.classList.remove("modal__media--zoomable", "modal__media--zooming");
    modalImg.style.transform = "";
    modalImg.style.transformOrigin = "";
  }

  function updateImageZoom(e) {
    if (modalImg.hidden || !modalImg.src) return;

    const rect = modalMedia.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    modalMedia.classList.add("modal__media--zooming");
    modalImg.style.transformOrigin = x + "% " + y + "%";
    modalImg.style.transform = "scale(" + ZOOM_SCALE + ")";
  }

  function initImageZoom() {
    modalMedia.addEventListener("mouseenter", () => {
      if (!modalImg.hidden && modalImg.src) {
        modalMedia.classList.add("modal__media--zoomable");
      }
    });
    modalMedia.addEventListener("mousemove", updateImageZoom);
    modalMedia.addEventListener("mouseleave", resetImageZoom);
  }

  function clearMedia() {
    const ph = modalMedia.querySelector(".modal__placeholder-wrap");
    if (ph) ph.remove();
    modalImg.onload = null;
    modalImg.onerror = null;
    modalImg.hidden = true;
    modalImg.removeAttribute("src");
    modalImg.removeAttribute("alt");
    resetImageZoom();
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
    modalImg.onload = function () {
      if (!modalImg.hidden && modalImg.src) {
        modalMedia.classList.add("modal__media--zoomable");
      }
    };
    modalImg.onerror = function () {
      modalImg.hidden = true;
      modalImg.removeAttribute("src");
      resetImageZoom();
      const wrap = document.createElement("div");
      wrap.className = "modal__placeholder-wrap";
      wrap.setAttribute("aria-hidden", "true");
      wrap.textContent = "🧶";
      modalMedia.appendChild(wrap);
    };
  }

  function swatchImagePath(item) {
    if (item.imagenSwatch) return item.imagenSwatch;
    if (!item.imagen) return null;
    const slash = item.imagen.lastIndexOf("/");
    if (slash === -1) return null;
    return item.imagen.slice(0, slash + 1) + "zoom.png";
  }

  function pickerImage(item, kind) {
    if (kind === "swatch") return swatchImagePath(item);
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
    btn.setAttribute(
      "aria-selected",
      modalActive && modalActive.id === item.id ? "true" : "false"
    );
    btn.setAttribute("aria-label", item.nombre + ", color " + item.color);
    btn.title = item.nombre;

    const imgPath = pickerImage(item, kind);
    if (imgPath) {
      const img = document.createElement("img");
      img.className = "color-picker__img";
      img.alt = "";
      img.src = encodePath(imgPath);
      img.loading = "lazy";
      if (kind === "swatch") {
        img.onerror = function () {
          img.remove();
          const span = document.createElement("span");
          span.className = "color-picker__fallback";
          span.textContent = String(item.color);
          btn.appendChild(span);
        };
      }
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
    modalCodigo.textContent = item.codigo;
    modalColorLabel.textContent = "Color " + item.color + " — " + item.nombre;
    if (modalDescripcion) modalDescripcion.textContent = item.descripcion || "";

    setMainImage(item);
    renderPickers();
  }

  /** @param {CategoriaGrupo} grupo */
  function openModal(grupo) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    modalGrupo = grupo;
    modalVariants = grupo.variantes;
    if (modalCategoria) modalCategoria.textContent = grupo.categoria;
    modalTitle.textContent = grupo.categoria;
    modalPrecio.textContent = formatPrecio(grupo.precio);
    modalDetalles.textContent = grupo.detalles || "Sin información adicional.";

    selectVariant(modalVariants[0]);

    modal.querySelector(".modal__close").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    modalVariants = [];
    modalActive = null;
    modalGrupo = null;
    resetImageZoom();
  }

  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  initImageZoom();

  if (!data.length) {
    resultsCount.textContent =
      "No hay datos. Ejecutá npm run build:data en catalogo-app.";
  } else {
    categorias = buildCategorias();
    renderGrid();
  }
})();
