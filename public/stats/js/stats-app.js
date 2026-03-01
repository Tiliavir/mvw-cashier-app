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
    if (titleEl) titleEl.textContent = event.name + ' - ' + UI.formatDate(event.createdAt);

    renderStatCards(event);
    renderItemsTable(event);
    renderCharts(event);

    on('btn-back-settings', 'click', function () {
      sessionStorage.setItem('vt-direction', 'back');
      location.href = Paths.page('settings');
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

  // ─── Time-series charts ──────────────────────────────────────────────────
  function renderCharts(event) {
    const countContainer = document.getElementById('stats-chart-count');
    const amountContainer = document.getElementById('stats-chart-amount');
    if (!countContainer || !amountContainer) return;

    const transactions = event.transactions;
    if (transactions.length === 0) {
      countContainer.innerHTML = '<p class="empty-hint">Keine Transaktionen vorhanden.</p>';
      amountContainer.innerHTML = '<p class="empty-hint">Keine Transaktionen vorhanden.</p>';
      return;
    }

    const hourMap = {};
    transactions.forEach(function (tx) {
      const date = new Date(tx.timestamp);
      const key = date.toISOString().slice(0, 13);
      if (!hourMap[key]) {
        hourMap[key] = { label: key.slice(11) + ':00', count: 0, amount: 0 };
      }
      hourMap[key].count += 1;
      hourMap[key].amount = Math.round((hourMap[key].amount + tx.total) * 100) / 100;
    });

    const keys = Object.keys(hourMap).sort();
    const countData = keys.map(function (key) {
      return { label: hourMap[key].label, value: hourMap[key].count };
    });
    const amountData = keys.map(function (key) {
      return { label: hourMap[key].label, value: hourMap[key].amount };
    });

    drawLineChart(countContainer, countData, 'Anzahl Transaktionen pro Stunde');
    drawLineChart(amountContainer, amountData, 'Umsatz pro Stunde');
  }

  function drawLineChart(container, data, ariaLabel) {
    container.innerHTML = '';

    const NS = 'http://www.w3.org/2000/svg';
    const width = 600;
    const height = 220;
    const padding = { top: 16, right: 12, bottom: 36, left: 36 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const maxVal = Math.max(1, data.reduce(function (m, d) { return d.value > m ? d.value : m; }, 0));
    const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', ariaLabel);

    const axisX = document.createElementNS(NS, 'line');
    axisX.setAttribute('x1', String(padding.left));
    axisX.setAttribute('y1', String(padding.top + innerH));
    axisX.setAttribute('x2', String(padding.left + innerW));
    axisX.setAttribute('y2', String(padding.top + innerH));
    axisX.setAttribute('stroke', '#bbb');
    axisX.setAttribute('stroke-width', '1');
    svg.appendChild(axisX);

    const axisY = document.createElementNS(NS, 'line');
    axisY.setAttribute('x1', String(padding.left));
    axisY.setAttribute('y1', String(padding.top));
    axisY.setAttribute('x2', String(padding.left));
    axisY.setAttribute('y2', String(padding.top + innerH));
    axisY.setAttribute('stroke', '#bbb');
    axisY.setAttribute('stroke-width', '1');
    svg.appendChild(axisY);

    let points = '';
    data.forEach(function (d, i) {
      const x = padding.left + xStep * i;
      const y = padding.top + innerH - (d.value / maxVal) * innerH;
      points += x + ',' + y + ' ';

      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(y));
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', '#3498db');
      const title = document.createElementNS(NS, 'title');
      title.textContent = d.label + ': ' + d.value;
      dot.appendChild(title);
      svg.appendChild(dot);

      if (i === 0 || i === data.length - 1 || i % 2 === 0) {
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('x', String(x));
        label.setAttribute('y', String(height - 10));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', '#888');
        label.textContent = d.label;
        svg.appendChild(label);
      }
    });

    const polyline = document.createElementNS(NS, 'polyline');
    polyline.setAttribute('points', points.trim());
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#3498db');
    polyline.setAttribute('stroke-width', '2');
    svg.insertBefore(polyline, svg.childNodes[2] || null);

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
