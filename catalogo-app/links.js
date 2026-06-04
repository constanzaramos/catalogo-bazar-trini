(function () {
  const cfg = window.LINKS_CONFIG;
  if (!cfg) return;

  const $ = (id) => document.getElementById(id);

  $("profile-logo").src = cfg.logo;
  $("profile-logo").alt = cfg.nombre;
  $("profile-title").textContent = cfg.nombre;
  $("profile-tagline").textContent = cfg.tagline;

  $("link-instagram").href = cfg.instagram;
  $("link-facebook").href = cfg.facebook;
  $("link-tiktok").href = cfg.tiktok;
  $("link-whatsapp").href = cfg.whatsapp;
  $("link-email").href = cfg.email;
  $("link-catalogo").href = cfg.catalogo;

  const container = $("locales-list");

  (cfg.locales || []).forEach(({ galeria, direccion, puntos }) => {
    const block = document.createElement("section");
    block.className = "links-locales__galeria";

    const title = document.createElement("h3");
    title.className = "links-locales__galeria-title";
    title.textContent = galeria;
    block.appendChild(title);

    const addr = document.createElement("p");
    addr.className = "links-locales__direccion";
    addr.textContent = direccion;
    block.appendChild(addr);

    const query = encodeURIComponent(`${direccion}, Rosario`);
    const mapa = document.createElement("a");
    mapa.className = "links-locales__mapa";
    mapa.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
    mapa.target = "_blank";
    mapa.rel = "noopener noreferrer";
    mapa.textContent = "Ver en mapa";
    block.appendChild(mapa);

    puntos.forEach(({ nombre, horarios }) => {
      const punto = document.createElement("div");
      punto.className = "links-locales__punto";

      const puntoTitle = document.createElement("h4");
      puntoTitle.className = "links-locales__punto-title";
      puntoTitle.textContent = nombre;
      punto.appendChild(puntoTitle);

      const list = document.createElement("ul");
      list.className = "links-locales__horarios";
      horarios.forEach(({ dias, horas }) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${dias}</strong><span>${horas}</span>`;
        list.appendChild(li);
      });
      punto.appendChild(list);
      block.appendChild(punto);
    });

    container.appendChild(block);
  });

  if (cfg.notaHorarios) {
    const foot = document.createElement("p");
    foot.className = "links-locales__nota";
    foot.textContent = cfg.notaHorarios;
    container.appendChild(foot);
  }
})();
