let stockFardos = 250;
let materiaPrimaKg = 3000;
const precioUnitario = 18500;
const kgPorFardo = 10;
const PIN_SUPERVISOR_VALIDO = "1234";

let correlativoVenta = 128;
let correlativoRecepcion = 42;
let correlativoDeposito = 19;
let correlativoFracc = 31;
let correlativoMerma = 14;

let totalFardosVendidos = 0;
let totalFardosFraccionados = 0;
let totalFardosMerma = 0;
let facturacionAcumulada = 0;
const movimientos = [];

function registrarMovimiento(texto) {
  movimientos.unshift(texto);
  renderizarMovimientos();
}

function renderizarMovimientos() {
  const ul = document.getElementById("listaMovimientos");
  if (!movimientos.length) {
    ul.innerHTML = "<li>Sin movimientos registrados aún en esta sesión.</li>";
    return;
  }
  ul.innerHTML = movimientos.slice(0, 12).map((m) => `<li>${m}</li>`).join("");
}

function sincronizarEstados() {
  document.getElementById("stockDisponible").textContent = stockFardos;
  document.getElementById("stockDepositoDisplay").textContent = stockFardos;
  document.getElementById("stockFraccDisplay").textContent = stockFardos;
  document.getElementById("stockDisponibleMerma").textContent = stockFardos;

  document.getElementById("mpDisponibleDisplay").textContent = materiaPrimaKg;
  document.getElementById("mpEquivFardos").textContent = Math.floor(materiaPrimaKg / kgPorFardo);
  document.getElementById("mpFraccDisplay").textContent = materiaPrimaKg;

  actualizarKgRequeridosFracc();
  actualizarReporteEstrategico();
}

function mostrarAlerta(idElemento, texto, tipo) {
  const el = document.getElementById(idElemento);
  el.textContent = texto;
  el.className = `alerta full-width ${tipo === "error" ? "alerta-error" : "alerta-ok"}`;
}

function ocultarAlerta(idElemento) {
  const el = document.getElementById(idElemento);
  el.className = "alerta full-width oculto";
  el.textContent = "";
}

const inputCantidadVenta = document.getElementById("cantidadFardos");
function actualizarTotalEstimado() {
  const cant = Number(inputCantidadVenta.value) || 0;
  document.getElementById("totalEstimado").textContent = (cant * precioUnitario).toLocaleString("es-AR");
}

inputCantidadVenta.addEventListener("input", () => {
  ocultarAlerta("mensajeVenta");
  actualizarTotalEstimado();
});

document.getElementById("formVenta").addEventListener("submit", (e) => {
  e.preventDefault();
  const cant = Number(inputCantidadVenta.value);
  const [clienteNombre, tipoCliente] = document.getElementById("cliente").value.split("|");
  const fecha = document.getElementById("fechaVenta").value;
  const formaPago = document.getElementById("formaPago").value;

  if (!cant || cant <= 0) {
    mostrarAlerta("mensajeVenta", "Ingresá una cantidad de fardos mayor a cero.", "error");
    return;
  }

  if (cant > stockFardos) {
    mostrarAlerta(
      "mensajeVenta",
      `Stock insuficiente: solicitaste ${cant} fardos y solo hay ${stockFardos} disponibles.`,
      "error"
    );
    return;
  }

  stockFardos -= cant;
  totalFardosVendidos += cant;
  const totalVenta = cant * precioUnitario;
  facturacionAcumulada += totalVenta;

  const nroComprobante = `V-${String(correlativoVenta).padStart(5, "0")}`;
  correlativoVenta++;
  document.getElementById("nroVentaDisplay").textContent = `N° Venta: V-${String(correlativoVenta).padStart(5, "0")}`;

  sincronizarEstados();
  ocultarAlerta("mensajeVenta");
  mostrarAlerta("mensajeVenta", "Venta registrada con éxito y stock actualizado.", "ok");

  const box = document.getElementById("comprobanteVentaBox");
  box.className = "comprobante";
  box.innerHTML = `
    <h3>Comprobante de Venta (${nroComprobante})</h3>
    <p><strong>Fecha:</strong> ${fecha} | <strong>Forma de pago:</strong> ${formaPago}</p>
    <p><strong>Cliente:</strong> ${clienteNombre} (${tipoCliente})</p>
    <p><strong>Detalle:</strong> ${cant} fardos de 10 kg — Total: <strong>$${totalVenta.toLocaleString("es-AR")}</strong></p>
    <p><strong>Stock restante:</strong> ${stockFardos} fardos</p>
  `;

  registrarMovimiento(`[${fecha}] Venta ${nroComprobante}: -${cant} fardos a ${clienteNombre} ($${totalVenta.toLocaleString("es-AR")}).`);
  inputCantidadVenta.value = "";
  actualizarTotalEstimado();
});

document.getElementById("btnLimpiarVenta").addEventListener("click", () => {
  document.getElementById("formVenta").reset();
  document.getElementById("fechaVenta").value = "2026-11-25";
  ocultarAlerta("mensajeVenta");
  document.getElementById("comprobanteVentaBox").className = "comprobante oculto";
  actualizarTotalEstimado();
});

document.getElementById("formRecepcion").addEventListener("submit", (e) => {
  e.preventDefault();
  const kilos = Number(document.getElementById("kilosRecepcion").value);
  const proveedor = document.getElementById("proveedorMP").value;
  const fecha = document.getElementById("fechaRecepcion").value;
  const lote = document.getElementById("loteRecepcion").value.trim() || "Sin remito";

  if (!kilos || kilos <= 0) {
    mostrarAlerta("mensajeRecepcion", "Ingresá una cantidad en kg mayor a cero.", "error");
    return;
  }

  materiaPrimaKg += kilos;
  const nroIngreso = `R-${String(correlativoRecepcion).padStart(5, "0")}`;
  correlativoRecepcion++;
  document.getElementById("nroRecepcionDisplay").textContent = `Ingreso: R-${String(correlativoRecepcion).padStart(5, "0")}`;

  sincronizarEstados();
  mostrarAlerta("mensajeRecepcion", "Recepción de materia prima registrada.", "ok");

  const box = document.getElementById("comprobanteRecepcionBox");
  box.className = "comprobante";
  box.innerHTML = `
    <h3>Constancia de Recepción (${nroIngreso})</h3>
    <p><strong>Fecha:</strong> ${fecha} | <strong>Proveedor:</strong> ${proveedor}</p>
    <p><strong>Lote / Remito:</strong> ${lote} | <strong>Ingresó:</strong> +${kilos} kg</p>
    <p><strong>Materia prima disponible:</strong> ${materiaPrimaKg} kg</p>
  `;

  registrarMovimiento(`[${fecha}] Recepción ${nroIngreso}: +${kilos} kg de ${proveedor} (${lote}).`);
  document.getElementById("formRecepcion").reset();
  document.getElementById("fechaRecepcion").value = "2026-11-25";
});

document.getElementById("btnLimpiarRecepcion").addEventListener("click", () => {
  document.getElementById("formRecepcion").reset();
  document.getElementById("fechaRecepcion").value = "2026-11-25";
  ocultarAlerta("mensajeRecepcion");
  document.getElementById("comprobanteRecepcionBox").className = "comprobante oculto";
});

document.getElementById("formDeposito").addEventListener("submit", (e) => {
  e.preventDefault();
  const cant = Number(document.getElementById("cantidadDeposito").value);
  const [nombreDep, capMax] = document.getElementById("depositoDestino").value.split("|");
  const fecha = document.getElementById("fechaDeposito").value;
  const ubicacion = document.getElementById("ubicacionPasillo").value.trim() || "General";

  if (!cant || cant <= 0) {
    mostrarAlerta("mensajeDeposito", "Ingresá una cantidad de fardos mayor a cero.", "error");
    return;
  }

  if (cant > stockFardos) {
    mostrarAlerta("mensajeDeposito", `No podés asignar ${cant} fardos: el stock disponible es de ${stockFardos}.`, "error");
    return;
  }

  if (cant > Number(capMax)) {
    mostrarAlerta("mensajeDeposito", `La cantidad supera la capacidad máxima de ${nombreDep} (${capMax} fardos).`, "error");
    return;
  }

  const nroAsig = `D-${String(correlativoDeposito).padStart(5, "0")}`;
  correlativoDeposito++;
  document.getElementById("nroDepositoDisplay").textContent = `Asignación: D-${String(correlativoDeposito).padStart(5, "0")}`;
  document.getElementById("estadoCapacidadDep").textContent = `Asignado a ${nombreDep}`;

  mostrarAlerta("mensajeDeposito", "Asignación de depósito confirmada.", "ok");

  const box = document.getElementById("comprobanteDepositoBox");
  box.className = "comprobante";
  box.innerHTML = `
    <h3>Asignación de Depósito (${nroAsig})</h3>
    <p><strong>Fecha:</strong> ${fecha} | <strong>Depósito:</strong> ${nombreDep}</p>
    <p><strong>Ubicación:</strong> ${ubicacion} | <strong>Fardos asignados:</strong> ${cant}</p>
  `;

  registrarMovimiento(`[${fecha}] Depósito ${nroAsig}: ${cant} fardos asignados a ${nombreDep} (${ubicacion}).`);
  document.getElementById("formDeposito").reset();
  document.getElementById("fechaDeposito").value = "2026-11-25";
});

document.getElementById("btnLimpiarDeposito").addEventListener("click", () => {
  document.getElementById("formDeposito").reset();
  document.getElementById("fechaDeposito").value = "2026-11-25";
  ocultarAlerta("mensajeDeposito");
  document.getElementById("comprobanteDepositoBox").className = "comprobante oculto";
});

const inputFardosFracc = document.getElementById("fardosAFraccionar");
function actualizarKgRequeridosFracc() {
  const fardos = Number(inputFardosFracc.value) || 0;
  document.getElementById("kgRequeridosFracc").textContent = fardos * kgPorFardo;
}

inputFardosFracc.addEventListener("input", () => {
  ocultarAlerta("mensajeFracc");
  actualizarKgRequeridosFracc();
});

document.getElementById("formFraccionamiento").addEventListener("submit", (e) => {
  e.preventDefault();
  const fardos = Number(inputFardosFracc.value);
  const kgNecesarios = fardos * kgPorFardo;
  const fecha = document.getElementById("fechaFracc").value;
  const linea = document.getElementById("lineaFracc").value;
  const lote = document.getElementById("loteFracc").value.trim() || "Sin lote";

  if (!fardos || fardos <= 0) {
    mostrarAlerta("mensajeFracc", "Ingresá una cantidad de fardos a fraccionar mayor a cero.", "error");
    return;
  }

  if (kgNecesarios > materiaPrimaKg) {
    mostrarAlerta(
      "mensajeFracc",
      `Materia prima insuficiente: necesitás ${kgNecesarios} kg y hay ${materiaPrimaKg} kg disponibles.`,
      "error"
    );
    return;
  }

  materiaPrimaKg -= kgNecesarios;
  stockFardos += fardos;
  totalFardosFraccionados += fardos;

  const nroOrden = `F-${String(correlativoFracc).padStart(5, "0")}`;
  correlativoFracc++;
  document.getElementById("nroFraccDisplay").textContent = `Orden: F-${String(correlativoFracc).padStart(5, "0")}`;

  sincronizarEstados();
  mostrarAlerta("mensajeFracc", "Fraccionamiento completado: se sumaron fardos al stock.", "ok");

  const box = document.getElementById("comprobanteFraccBox");
  box.className = "comprobante comprobante-ok";
  box.innerHTML = `
    <h3>Orden de Fraccionamiento (${nroOrden})</h3>
    <p><strong>Fecha:</strong> ${fecha} | <strong>${linea}</strong> | <strong>Lote:</strong> ${lote}</p>
    <p><strong>Consumido:</strong> -${kgNecesarios} kg de materia prima</p>
    <p><strong>Producido:</strong> +${fardos} fardos de 10 kg (${fardos * 10} bolsas de 1 kg)</p>
    <p><strong>Nuevo stock de fardos:</strong> ${stockFardos} fardos</p>
  `;

  registrarMovimiento(`[${fecha}] Fraccionamiento ${nroOrden}: +${fardos} fardos (-${kgNecesarios} kg MP) en ${linea}.`);
  inputFardosFracc.value = "";
  actualizarKgRequeridosFracc();
});

document.getElementById("btnLimpiarFracc").addEventListener("click", () => {
  document.getElementById("formFraccionamiento").reset();
  document.getElementById("fechaFracc").value = "2026-11-25";
  ocultarAlerta("mensajeFracc");
  document.getElementById("comprobanteFraccBox").className = "comprobante comprobante-ok oculto";
  actualizarKgRequeridosFracc();
});

document.getElementById("formMerma").addEventListener("submit", (e) => {
  e.preventDefault();
  const cant = Number(document.getElementById("cantidadMerma").value);
  const pin = document.getElementById("pinSupervisor").value.trim();
  const motivo = document.getElementById("motivoMerma").value;
  const fecha = document.getElementById("fechaMerma").value;
  const observacion = document.getElementById("observacionMerma").value.trim() || "Sin observaciones";

  if (!cant || cant <= 0) {
    mostrarAlerta("mensajeMerma", "Ingresá una cantidad de fardos mayor a cero para dar de baja.", "error");
    return;
  }

  if (cant > stockFardos) {
    mostrarAlerta(
      "mensajeMerma",
      `No podés dar de baja ${cant} fardos porque el stock disponible es de ${stockFardos} fardos.`,
      "error"
    );
    return;
  }

  if (pin !== PIN_SUPERVISOR_VALIDO) {
    mostrarAlerta("mensajeMerma", "PIN de Supervisor incorrecto. Baja no autorizada.", "error");
    return;
  }

  stockFardos -= cant;
  totalFardosMerma += cant;

  const nroBaja = `M-${String(correlativoMerma).padStart(5, "0")}`;
  correlativoMerma++;
  document.getElementById("nroMermaDisplay").textContent = `N° Baja: M-${String(correlativoMerma).padStart(5, "0")}`;

  sincronizarEstados();
  mostrarAlerta("mensajeMerma", "Baja / Merma autorizada por supervisor y descontada del stock.", "ok");

  const box = document.getElementById("comprobanteMermaBox");
  box.className = "comprobante comprobante-merma";
  box.innerHTML = `
    <h3>Constancia de Baja / Merma (${nroBaja})</h3>
    <p><strong>Fecha:</strong> ${fecha} | <strong>Autorización:</strong> Supervisor (PIN verificado)</p>
    <p><strong>Motivo:</strong> ${motivo}</p>
    <p><strong>Cantidad dada de baja:</strong> ${cant} fardos de 10 kg</p>
    <p><strong>Observación:</strong> ${observacion}</p>
    <p><strong>Stock restante en depósito:</strong> ${stockFardos} fardos</p>
  `;

  registrarMovimiento(`[${fecha}] Baja ${nroBaja}: -${cant} fardos por ${motivo} (PIN OK).`);
  document.getElementById("formMerma").reset();
  document.getElementById("fechaMerma").value = "2026-11-25";
});

document.getElementById("btnLimpiarMerma").addEventListener("click", () => {
  document.getElementById("formMerma").reset();
  document.getElementById("fechaMerma").value = "2026-11-25";
  ocultarAlerta("mensajeMerma");
  document.getElementById("comprobanteMermaBox").className = "comprobante comprobante-merma oculto";
});

function actualizarReporteEstrategico() {
  document.getElementById("kpiStockFardos").textContent = stockFardos;
  document.getElementById("kpiMPKg").textContent = materiaPrimaKg;
  document.getElementById("kpiFardosVendidos").textContent = totalFardosVendidos;
  document.getElementById("kpiFardosFracc").textContent = totalFardosFraccionados;
  document.getElementById("kpiFardosMerma").textContent = totalFardosMerma;
  document.getElementById("kpiFacturacion").textContent = `$${facturacionAcumulada.toLocaleString("es-AR")}`;

  const alertaBajo = document.getElementById("alertaStockBajo");
  if (stockFardos < 50) {
    alertaBajo.textContent = `Alerta de stock crítico: quedan solo ${stockFardos} fardos disponibles (umbral sugerido: 50 fardos).`;
    alertaBajo.className = "alerta alerta-error";
  } else {
    alertaBajo.className = "alerta alerta-error oculto";
  }
}

document.getElementById("btnActualizarReporte").addEventListener("click", actualizarReporteEstrategico);

const selectAccion = document.getElementById("selectAccion");

function cambiarVista(caso) {
  document.querySelectorAll(".tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.caso === caso);
  });
  if (selectAccion) {
    selectAccion.value = caso;
  }

  const secciones = ["venta", "recepcion", "deposito", "fraccionamiento", "merma", "reporte"];
  secciones.forEach((sec) => {
    document.getElementById(`vista-${sec}`).classList.toggle("oculto", caso !== sec);
  });

  if (caso === "reporte") {
    actualizarReporteEstrategico();
  }
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => cambiarVista(btn.dataset.caso));
});

if (selectAccion) {
  selectAccion.addEventListener("change", () => cambiarVista(selectAccion.value));
}

sincronizarEstados();
actualizarTotalEstimado();
