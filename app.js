// Delmic Azúcar · prototipo SGA
const $ = (id) => document.getElementById(id);
const KEY = "delmic-sga-v2";
const DEPS = [
  { n: "Depósito Principal (Sector A)", cap: 1000 },
  { n: "Depósito Fraccionamiento (Sector B)", cap: 500 },
  { n: "Depósito Expedición (Sector C)", cap: 400 },
];
const PRECIOS = { Mayorista: 17500, Minorista: 18500 };
const KG = 10, PIN = "1234", UMBRAL = 50;
const money = (n) => "$" + n.toLocaleString("es-AR");
const pad = (p, n) => `${p}-${String(n).padStart(5, "0")}`;

const inicial = () => ({
  dep: [150, 50, 50], mp: 3000,
  c: { v: 128, r: 42, d: 19, f: 31, m: 14 },
  vend: 0, fracc: 0, merma: 0, fact: 0, movs: [],
});
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || inicial(); } catch { S = inicial(); }
const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const stock = () => S.dep.reduce((a, b) => a + b, 0);

// descuenta fardos: primero Expedición, luego Principal, luego Fraccionamiento
function descontar(n) {
  for (const i of [2, 0, 1]) { const t = Math.min(n, S.dep[i]); S.dep[i] -= t; n -= t; }
}

function toast(msg, tipo) {
  const t = document.createElement("div");
  t.className = "toast " + (tipo === "error" ? "error" : "");
  t.textContent = msg;
  $("toasts").appendChild(t);
  setTimeout(() => t.remove(), 3800);
}
function falla(msg, inputId) {
  toast(msg, "error");
  if (inputId) { const el = $(inputId); el.classList.add("err"); el.focus(); }
}
const limpiarErr = () => document.querySelectorAll(".err").forEach((e) => e.classList.remove("err"));
function comprobante(id, html) { const b = $(id); b.innerHTML = html; b.classList.remove("hide"); }
function mov(fecha, tipo, detalle, q) {
  S.movs.unshift({ fecha, tipo, detalle, q });
  S.movs = S.movs.slice(0, 30);
}
function hoy() {
  const d = new Date();
  const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  document.querySelectorAll(".hoy").forEach((i) => (i.value = v));
}

// ---------- Render ----------
function barras() {
  return DEPS.map((d, i) => {
    const p = Math.round((S.dep[i] / d.cap) * 100);
    return `<div class="dep"><div class="top"><span>${d.n}</span><b>${S.dep[i]} / ${d.cap} fardos</b></div>
    <div class="bar"><i class="${p > 85 ? "hi" : ""}" style="width:${p}%"></i></div></div>`;
  }).join("");
}
function flash(el, txt) {
  if (el.textContent !== txt) { el.textContent = txt; el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 500); }
}
function precioActual() { return PRECIOS[$("cliente").value.split("|")[1]]; }

function render() {
  const st = stock();
  flash($("sFardos"), st); flash($("sMP"), S.mp + " kg"); flash($("sFact"), money(S.fact));
  document.querySelectorAll(".stk").forEach((e) => (e.textContent = st));
  document.querySelectorAll(".mp").forEach((e) => (e.textContent = S.mp));
  $("eqFardos").textContent = Math.floor(S.mp / KG);
  $("nVenta").textContent = pad("V", S.c.v); $("nRecep").textContent = pad("R", S.c.r);
  $("nDep").textContent = pad("D", S.c.d); $("nFracc").textContent = pad("F", S.c.f);
  $("nMerma").textContent = pad("M", S.c.m);
  $("precio").textContent = money(precioActual());
  $("total").textContent = money((Number($("cantVenta").value) || 0) * precioActual());
  $("kgNec").textContent = (Number($("cantFracc").value) || 0) * KG;
  $("depBars").innerHTML = barras();
  $("repBars").innerHTML = barras();

  const k = [
    ["Stock de fardos", st, st < UMBRAL ? "low" : "good"],
    ["Materia prima (kg)", S.mp, ""],
    ["Fardos vendidos", S.vend, ""],
    ["Fardos fraccionados", S.fracc, ""],
    ["Bajas / mermas", S.merma, S.merma ? "low" : ""],
    ["Facturación", money(S.fact), "good"],
  ];
  $("kpis").innerHTML = k.map(([l, v, c]) => `<div class="kpi ${c}"><small>${l}</small><b>${v}</b></div>`).join("");

  const a = $("alertaStock");
  if (st < UMBRAL) { a.textContent = `Stock crítico: quedan ${st} fardos. Conviene fraccionar más.`; a.className = "alert"; }
  else if (st < 100) { a.textContent = `Stock bajo: ${st} fardos (umbral ${UMBRAL}).`; a.className = "alert warn"; }
  else a.className = "alert hide";

  $("movs").innerHTML = S.movs.length
    ? S.movs.map((m) => `<tr><td>${m.fecha}</td><td><span class="tag ${m.tipo}">${m.tipo}</span></td><td>${m.detalle}</td><td>${m.q}</td></tr>`).join("")
    : `<tr><td colspan="4">Todavía no hay movimientos. Registrá una venta o un fraccionamiento.</td></tr>`;
  guardar();
}

// ---------- Venta ----------
["cantVenta", "cliente"].forEach((id) => $(id).addEventListener("input", render));
$("fVenta").addEventListener("submit", (e) => {
  e.preventDefault(); limpiarErr();
  const cant = Number($("cantVenta").value);
  const [cli, tipo] = $("cliente").value.split("|");
  if (!cant || cant <= 0) return falla("Ingresá una cantidad mayor a cero.", "cantVenta");
  if (cant > stock()) return falla(`Stock insuficiente: pediste ${cant} y hay ${stock()}.`, "cantVenta");
  const total = cant * PRECIOS[tipo], nro = pad("V", S.c.v), f = $("fVentaFecha").value;
  descontar(cant); S.c.v++; S.vend += cant; S.fact += total;
  mov(f, "Venta", `${cli} (${tipo}) · ${money(total)}`, -cant);
  comprobante("cVenta", `<h3>Comprobante ${nro}</h3><p><b>Fecha:</b> ${f} · <b>Pago:</b> ${$("pago").value}</p>
    <p><b>Cliente:</b> ${cli} (${tipo})</p><p><b>Detalle:</b> ${cant} fardos × ${money(PRECIOS[tipo])} = <b>${money(total)}</b></p>
    <p><b>Stock restante:</b> ${stock()} fardos</p>`);
  toast(`Venta ${nro} registrada: ${money(total)}`);
  $("cantVenta").value = ""; render();
});

// ---------- Recepción ----------
$("fRecep").addEventListener("submit", (e) => {
  e.preventDefault(); limpiarErr();
  const kg = Number($("kgRecep").value);
  if (!kg || kg <= 0) return falla("Ingresá los kilos recibidos.", "kgRecep");
  const nro = pad("R", S.c.r), f = $("fRecepFecha").value, prov = $("prov").value, rem = $("remito").value.trim() || "Sin remito";
  S.mp += kg; S.c.r++;
  mov(f, "Recepción", `${prov} · ${rem} · +${kg} kg`, "—");
  comprobante("cRecep", `<h3>Constancia ${nro}</h3><p><b>Fecha:</b> ${f} · <b>Proveedor:</b> ${prov}</p>
    <p><b>Remito:</b> ${rem} · <b>Ingresó:</b> +${kg} kg</p><p><b>Materia prima total:</b> ${S.mp} kg</p>`);
  toast(`Recepción ${nro}: +${kg} kg`);
  $("fRecep").reset(); hoy(); render();
});

// ---------- Depósitos (traslado) ----------
const opts = DEPS.map((d, i) => `<option value="${i}">${d.n}</option>`).join("");
$("depOrigen").innerHTML = opts; $("depDestino").innerHTML = opts; $("depDestino").value = "2";
$("fDep").addEventListener("submit", (e) => {
  e.preventDefault(); limpiarErr();
  const o = Number($("depOrigen").value), d = Number($("depDestino").value), n = Number($("cantDep").value);
  if (!n || n <= 0) return falla("Ingresá cuántos fardos mover.", "cantDep");
  if (o === d) return falla("El origen y el destino son el mismo depósito.");
  if (n > S.dep[o]) return falla(`${DEPS[o].n} solo tiene ${S.dep[o]} fardos.`, "cantDep");
  if (S.dep[d] + n > DEPS[d].cap) return falla(`No entra: ${DEPS[d].n} tiene lugar para ${DEPS[d].cap - S.dep[d]} fardos más.`, "cantDep");
  const nro = pad("D", S.c.d), ub = $("ubic").value.trim() || "General", f = new Date().toLocaleDateString("en-CA");
  S.dep[o] -= n; S.dep[d] += n; S.c.d++;
  mov(f, "Traslado", `${DEPS[o].n} → ${DEPS[d].n} (${ub})`, n);
  comprobante("cDep", `<h3>Traslado ${nro}</h3><p><b>Desde:</b> ${DEPS[o].n}</p><p><b>Hacia:</b> ${DEPS[d].n} · ${ub}</p><p><b>Fardos:</b> ${n}</p>`);
  toast(`Traslado ${nro} confirmado`);
  $("fDep").reset(); $("depDestino").value = "2"; render();
});

// ---------- Fraccionamiento ----------
$("cantFracc").addEventListener("input", render);
$("fFracc").addEventListener("submit", (e) => {
  e.preventDefault(); limpiarErr();
  const n = Number($("cantFracc").value), kg = n * KG;
  if (!n || n <= 0) return falla("Ingresá cuántos fardos producir.", "cantFracc");
  if (kg > S.mp) return falla(`Falta materia prima: necesitás ${kg} kg y hay ${S.mp} kg.`, "cantFracc");
  if (S.dep[1] + n > DEPS[1].cap) return falla(`El Depósito Fraccionamiento solo tiene lugar para ${DEPS[1].cap - S.dep[1]} fardos. Trasladá stock primero.`, "cantFracc");
  const nro = pad("F", S.c.f), f = $("fFraccFecha").value, lote = $("lote").value.trim() || "Sin lote";
  S.mp -= kg; S.dep[1] += n; S.fracc += n; S.c.f++;
  mov(f, "Fraccionamiento", `${$("linea").value} · ${lote} · -${kg} kg MP`, n);
  comprobante("cFracc", `<h3>Orden ${nro}</h3><p><b>Fecha:</b> ${f} · ${$("linea").value} · <b>Lote:</b> ${lote}</p>
    <p><b>Consumido:</b> ${kg} kg · <b>Producido:</b> ${n} fardos (${n * 10} bolsas de 1 kg)</p><p><b>Stock total:</b> ${stock()} fardos</p>`);
  toast(`Fraccionamiento ${nro}: +${n} fardos`);
  $("cantFracc").value = ""; render();
});

// ---------- Mermas ----------
$("fMerma").addEventListener("submit", (e) => {
  e.preventDefault(); limpiarErr();
  const n = Number($("cantMerma").value);
  if (!n || n <= 0) return falla("Ingresá cuántos fardos dar de baja.", "cantMerma");
  if (n > stock()) return falla(`Solo hay ${stock()} fardos en stock.`, "cantMerma");
  if ($("pin").value.trim() !== PIN) return falla("PIN incorrecto. La baja no fue autorizada.", "pin");
  const nro = pad("M", S.c.m), f = $("fMermaFecha").value, mo = $("motivo").value, ob = $("obs").value.trim() || "Sin observaciones";
  descontar(n); S.c.m++; S.merma += n;
  mov(f, "Baja", `${mo} · ${ob}`, -n);
  comprobante("cMerma", `<h3>Baja ${nro}</h3><p><b>Fecha:</b> ${f} · <b>Autorizó:</b> Supervisor</p>
    <p><b>Motivo:</b> ${mo}</p><p><b>Fardos:</b> ${n} · <b>Obs.:</b> ${ob}</p><p><b>Stock restante:</b> ${stock()} fardos</p>`);
  toast(`Baja ${nro} autorizada`);
  $("fMerma").reset(); hoy(); render();
});

// ---------- Reset y reportes ----------
$("btnReset").addEventListener("click", () => {
  if (!confirm("¿Reiniciar la demo a los valores iniciales?")) return;
  S = inicial(); render(); toast("Demo reiniciada");
});
document.querySelectorAll("form").forEach((f) =>
  f.addEventListener("reset", () => { limpiarErr(); setTimeout(() => { hoy(); render(); }, 0); }));

// ---------- Navegación ----------
document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t === b));
    document.querySelectorAll("main > section").forEach((s) => s.classList.toggle("hide", s.id !== "v-" + b.dataset.v));
    render(); window.scrollTo({ top: 0 });
  }));

hoy(); render();
