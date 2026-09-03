(function () {
  const BLOCKS = [
    { name: "Nandurbar", x: 78, y: 18, w: 54, h: 28, risk: "low" },
    { name: "Dhule", x: 136, y: 14, w: 50, h: 30, risk: "low" },
    { name: "Jalgaon", x: 190, y: 22, w: 58, h: 32, risk: "low" },
    { name: "Nashik", x: 82, y: 50, w: 72, h: 44, risk: "severe" },
    { name: "Aurangabad", x: 160, y: 58, w: 62, h: 34, risk: "moderate" },
    { name: "Jalna", x: 226, y: 60, w: 44, h: 30, risk: "low" },
    { name: "Amravati", x: 274, y: 36, w: 58, h: 34, risk: "low" },
    { name: "Nagpur", x: 336, y: 32, w: 58, h: 38, risk: "moderate" },
    { name: "Bhandara", x: 398, y: 36, w: 44, h: 28, risk: "low" },
    { name: "Palghar", x: 28, y: 88, w: 44, h: 28, risk: "low" },
    { name: "Thane", x: 48, y: 118, w: 42, h: 28, risk: "low" },
    { name: "Ahmednagar", x: 108, y: 100, w: 64, h: 36, risk: "high" },
    { name: "Beed", x: 176, y: 98, w: 50, h: 32, risk: "low" },
    { name: "Parbhani", x: 230, y: 96, w: 50, h: 30, risk: "low" },
    { name: "Akola", x: 284, y: 76, w: 46, h: 28, risk: "low" },
    { name: "Yavatmal", x: 300, y: 108, w: 58, h: 32, risk: "low" },
    { name: "Wardha", x: 344, y: 76, w: 46, h: 28, risk: "low" },
    { name: "Mumbai", x: 22, y: 150, w: 46, h: 24, risk: "low" },
    { name: "Raigad", x: 52, y: 152, w: 44, h: 30, risk: "low" },
    { name: "Pune", x: 104, y: 142, w: 68, h: 40, risk: "high" },
    { name: "Osmanabad", x: 176, y: 136, w: 54, h: 30, risk: "low" },
    { name: "Latur", x: 234, y: 130, w: 50, h: 30, risk: "low" },
    { name: "Nanded", x: 288, y: 144, w: 54, h: 30, risk: "low" },
    { name: "Chandrapur", x: 348, y: 114, w: 58, h: 36, risk: "low" },
    { name: "Gadchiroli", x: 360, y: 154, w: 62, h: 40, risk: "low" },
    { name: "Satara", x: 96, y: 188, w: 58, h: 32, risk: "moderate" },
    { name: "Solapur", x: 160, y: 172, w: 58, h: 34, risk: "low" },
    { name: "Ratnagiri", x: 40, y: 190, w: 48, h: 36, risk: "low" },
    { name: "Sangli", x: 102, y: 224, w: 56, h: 30, risk: "moderate" },
    { name: "Kolhapur", x: 78, y: 258, w: 58, h: 30, risk: "low" },
    { name: "Sindhudurg", x: 28, y: 250, w: 44, h: 36, risk: "low" },
  ];

  const FILL = {
    low: "#c5d2b3",
    moderate: "#e6c35c",
    high: "#e0893a",
    severe: "#c4452d",
  };

  function paintStats() {
    if (!window.KD) return;
    KD.seedIfEmpty();
    const stats = KD.stats();
    const set = function (id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = String(value);
    };
    set("statQueue", stats.pending);
    set("statSevere", stats.severe);
    set("statHigh", stats.high);
    set("statConfirmed", stats.confirmed);
  }

  function paintMap() {
    const host = document.getElementById("blockMap");
    if (!host) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 448 304");
    svg.setAttribute("class", "block-map");
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      "Maharashtra district block map colored by outbreak risk"
    );

    BLOCKS.forEach(function (block) {
      const g = document.createElementNS(svgNS, "g");
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("class", "district");
      rect.setAttribute("x", block.x);
      rect.setAttribute("y", block.y);
      rect.setAttribute("width", block.w);
      rect.setAttribute("height", block.h);
      rect.setAttribute("rx", "7");
      rect.setAttribute("fill", FILL[block.risk] || FILL.low);
      const title = document.createElementNS(svgNS, "title");
      title.textContent =
        block.name + " · " + block.risk.toUpperCase();
      rect.appendChild(title);

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", block.x + block.w / 2);
      label.setAttribute("y", block.y + block.h / 2 + 3);
      label.setAttribute("text-anchor", "middle");
      if (block.risk === "severe" || block.risk === "high") {
        label.setAttribute("fill", "#f4efe6");
      }
      label.textContent =
        block.w >= 48 ? block.name : block.name.slice(0, 4);

      g.appendChild(rect);
      g.appendChild(label);
      svg.appendChild(g);
    });

    host.innerHTML = "";
    host.appendChild(svg);
  }

  paintStats();
  paintMap();

  window.addEventListener("storage", function (event) {
    if (event.key === (window.KD && KD.STORAGE_KEY)) paintStats();
  });
})();
