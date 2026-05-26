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

  const container = $("hours-list");
  const { galerias, nota } = cfg.horarios;

  galerias.forEach((galeria) => {
    const block = document.createElement("section");
    block.className = "links-hours__galeria";

    const title = document.createElement("h3");
    title.className = "links-hours__galeria-title";
    title.textContent = galeria.nombre;
    block.appendChild(title);

    galeria.locales.forEach((local) => {
      const localEl = document.createElement("div");
      localEl.className = "links-hours__local";

      const localTitle = document.createElement("h4");
      localTitle.className = "links-hours__local-title";
      localTitle.textContent = local.nombre;
      localEl.appendChild(localTitle);

      const list = document.createElement("ul");
      list.className = "links-hours__list";
      local.filas.forEach(({ dias, horas }) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${dias}</strong><span>${horas}</span>`;
        list.appendChild(li);
      });
      localEl.appendChild(list);
      block.appendChild(localEl);
    });

    container.appendChild(block);
  });

  if (nota) {
    const foot = document.createElement("p");
    foot.className = "links-hours__nota";
    foot.textContent = nota;
    container.appendChild(foot);
  }
})();
