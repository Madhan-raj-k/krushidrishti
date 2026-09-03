(function () {
  const listEl = document.getElementById("reportList");
  const chips = Array.from(document.querySelectorAll("[data-filter]"));
  let filter = "all";

  function percent(confidence) {
    return Math.round((confidence || 0) * 100) + "%";
  }

  function render() {
    if (!window.KD || !listEl) return;
    KD.seedIfEmpty();
    const reports = KD.getReports()
      .slice()
      .sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    const visible = reports.filter(function (item) {
      if (filter === "all") return true;
      if (filter === "pending") return item.status === "pending";
      return (item.severity || KD.severity(item.confidence)) === filter;
    });

    listEl.innerHTML = "";
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "card empty";
      empty.textContent =
        filter === "all" ? "Queue is empty." : "No " + filter + " reports.";
      listEl.appendChild(empty);
      return;
    }

    visible.forEach(function (report) {
      const severity = report.severity || KD.severity(report.confidence);
      const card = document.createElement("article");
      card.className = "card queue-card";

      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = report.label || report.labelId || "Unknown";
      const badge = document.createElement("span");
      badge.className = "badge " + severity;
      badge.textContent = severity;
      header.appendChild(badge);
      header.appendChild(title);

      const meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = [
        report.place || "Nashik",
        percent(report.confidence) + " model",
        KD.formatWhen(report.createdAt),
        report.status === "pending" ? "in queue" : report.status,
      ].join(" · ");

      const btns = document.createElement("div");
      btns.className = "report-btns";

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.dataset.id = report.id;
      confirmBtn.dataset.action = "confirmed";
      confirmBtn.textContent =
        report.status === "confirmed" ? "Confirmed" : "Confirm";
      if (report.status === "confirmed") confirmBtn.className = "ghost";

      const rejectBtn = document.createElement("button");
      rejectBtn.type = "button";
      rejectBtn.className = "reject";
      rejectBtn.dataset.id = report.id;
      rejectBtn.dataset.action = "rejected";
      rejectBtn.textContent =
        report.status === "rejected" ? "Rejected" : "Reject";
      if (report.status === "rejected") rejectBtn.className = "reject ghost";

      btns.appendChild(confirmBtn);
      btns.appendChild(rejectBtn);
      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(btns);
      listEl.appendChild(card);
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      filter = chip.getAttribute("data-filter") || "all";
      chips.forEach(function (item) {
        item.classList.toggle("secondary", item !== chip);
      });
      render();
    });
  });

  if (listEl) {
    listEl.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-action]");
      if (!btn || !window.KD) return;
      KD.setReportStatus(btn.dataset.id, btn.dataset.action);
      render();
    });
  }

  window.addEventListener("storage", function (event) {
    if (event.key === (window.KD && KD.STORAGE_KEY)) render();
  });

  render();
})();
