'use strict';

// ─── Stats Page ───────────────────────────────────────────────────────────────
const StatsApp = (function () {

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    const eventId = new URLSearchParams(location.search).get('id');
    const state = Store.loadState();
    const event = state.events.find(function (e) { return e.id === eventId; });

    if (!event) {
      const errEl = document.getElementById('stats-error');
      if (errEl) errEl.hidden = false;
      return;
    }

    const contentEl = document.getElementById('stats-content');
    if (contentEl) contentEl.hidden = false;

    const titleEl = document.getElementById('stats-event-name');
    if (titleEl) titleEl.textContent = event.name + ' – ' + UI.formatDate(event.createdAt);

    renderStatCards(event);
    renderItemsTable(event);
    renderChart(event);

    on('btn-back-settings', 'click', function () {
      sessionStorage.setItem('vt-direction', 'back');
      location.href = '/settings/';
    });
  }

  // ─── Stat cards ───────────────────────────────────────────────────────────
  function renderStatCards(event) {
    const container = document.getElementById('stat-cards');
    if (!container) return;
    const totals = Models.calculateEventTotals(event);

    const cards = [
      { label: 'Umsatz', value: UI.formatCurrency(totals.revenue) },
      { label: 'Trinkgeld', value: UI.formatCurrency(totals.tip) },
      { label: 'Transaktionen', value: String(totals.transactionCount) },
    ];

    cards.forEach(function (card) {
      const div = document.createElement('div');
      div.className = 'stat-card';
      const labelEl = document.createElement('div');
      labelEl.className = 'stat-card-label';
      labelEl.textContent = card.label;
      const valueEl = document.createElement('div');
      valueEl.className = 'stat-card-value';
      valueEl.textContent = card.value;
      div.appendChild(labelEl);
      div.appendChild(valueEl);
      container.appendChild(div);
    });
  }

  // ─── Items sold table ─────────────────────────────────────────────────────
  function renderItemsTable(event) {
    const tbody = document.getElementById('items-table-body');
    if (!tbody) return;
    const sold = Models.calculateItemsSold(event);

    const entries = Object.values(sold).sort(function (a, b) { return b.quantity - a.quantity; });

    if (entries.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.className = 'empty-hint';
      td.textContent = 'Keine Artikel verkauft.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    entries.forEach(function (entry) {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      nameTd.textContent = entry.name;
      const qtyTd = document.createElement('td');
      qtyTd.textContent = String(entry.quantity);
      const revTd = document.createElement('td');
      revTd.textContent = UI.formatCurrency(entry.revenue);
      tr.appendChild(nameTd);
      tr.appendChild(qtyTd);
      tr.appendChild(revTd);
      tbody.appendChild(tr);
    });
  }

  // ─── Transactions bar chart ───────────────────────────────────────────────
  function renderChart(event) {
    const container = document.getElementById('stats-chart');
    if (!container) return;
    const transactions = event.transactions;

    if (transactions.length === 0) {
      container.innerHTML = '<p class="empty-hint">Keine Transaktionen vorhanden.</p>';
      return;
    }

    const MAX_INDIVIDUAL = 50;
    let data;

    if (transactions.length > MAX_INDIVIDUAL) {
      // Group by hour
      const hourMap = {};
      transactions.forEach(function (tx) {
        const h = new Date(tx.timestamp).getHours();
        const key = (h < 10 ? '0' : '') + h + ':00';
        hourMap[key] = Math.round(((hourMap[key] || 0) + tx.total) * 100) / 100;
      });
      data = Object.keys(hourMap).sort().map(function (key) {
        return { label: key, value: hourMap[key] };
      });
    } else {
      data = transactions.map(function (tx, i) {
        return { label: String(i + 1), value: tx.total };
      });
    }

    const maxVal = data.reduce(function (m, d) { return d.value > m ? d.value : m; }, 0);
    const barH = 20;
    const gap = 4;
    const labelW = 30;
    const chartW = 260;
    const svgW = labelW + chartW + 4;
    const svgH = data.length * (barH + gap);

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + svgH);
    svg.setAttribute('width', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Transaktions-Übersicht');

    data.forEach(function (d, i) {
      const y = i * (barH + gap);
      const barW = maxVal > 0 ? Math.round((d.value / maxVal) * chartW) : 0;

      const labelEl = document.createElementNS(NS, 'text');
      labelEl.setAttribute('x', String(labelW - 4));
      labelEl.setAttribute('y', String(y + barH / 2 + 4));
      labelEl.setAttribute('text-anchor', 'end');
      labelEl.setAttribute('font-size', '10');
      labelEl.setAttribute('fill', '#888');
      labelEl.textContent = d.label;

      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', String(labelW));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(barW));
      rect.setAttribute('height', String(barH));
      rect.setAttribute('fill', '#3498db');
      rect.setAttribute('rx', '3');

      const title = document.createElementNS(NS, 'title');
      title.textContent = d.label + ': ' + UI.formatCurrency(d.value);
      rect.appendChild(title);

      svg.appendChild(labelEl);
      svg.appendChild(rect);
    });

    container.appendChild(svg);
  }

  // ─── Utility ──────────────────────────────────────────────────────────────
  function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  return { init: init };
}());

document.addEventListener('DOMContentLoaded', function () {
  StatsApp.init();
});
