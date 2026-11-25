let stockFardos = 250;
const precioUnitario = 18500;
let correlativoVenta = 128;

const inputCantidad = document.getElementById("cantidadFardos");
const spanStock = document.getElementById("stockDisponible");
const spanTotal = document.getElementById("totalEstimado");
const mensajeEstado = document.getElementById("mensajeEstado");
const comprobanteBox = document.getElementById("comprobanteBox");
const formVenta = document.getElementById("formVenta");
const btnLimpiar = document.getElementById("btnLimpiar");
const nroVentaDisplay = document.getElementById("nroVentaDisplay");

function actualizarTotalEstimado() {
  const cant = Number(inputCantidad.value) || 0;
  const total = cant * precioUnitario;
  spanTotal.textContent = total.toLocaleString("es-AR");
}

function mostrarAlerta(texto, tipo) {
  mensajeEstado.textContent = texto;
  mensajeEstado.className = `alerta full-width ${tipo === "error" ? "alerta-error" : "alerta-ok"}`;
}

function ocultarAlerta() {
  mensajeEstado.className = "alerta full-width oculto";
  mensajeEstado.textContent = "";
}

inputCantidad.addEventListener("input", () => {
  ocultarAlerta();
  actualizarTotalEstimado();
});

formVenta.addEventListener("submit", (e) => {
  e.preventDefault();
  const cant = Number(inputCantidad.value);
  const [clienteNombre, tipoCliente] = document.getElementById("cliente").value.split("|");
  const fecha = document.getElementById("fechaVenta").value;
  const formaPago = document.getElementById("formaPago").value;

  if (!cant || cant <= 0) {
    mostrarAlerta("Ingresá una cantidad de fardos mayor a cero.", "error");
    return;
  }

  if (cant > stockFardos) {
    mostrarAlerta(
      `Stock insuficiente: solicitaste ${cant} fardos y solo hay ${stockFardos} disponibles en depósito.`,
      "error"
    );
    return;
  }

  stockFardos -= cant;
  spanStock.textContent = stockFardos;

  const nroComprobante = `V-${String(correlativoVenta).padStart(5, "0")}`;
  correlativoVenta++;
  nroVentaDisplay.textContent = `N° Venta: V-${String(correlativoVenta).padStart(5, "0")}`;

  const totalVenta = cant * precioUnitario;
  ocultarAlerta();
  mostrarAlerta("Venta registrada con éxito y stock actualizado.", "ok");

  comprobanteBox.className = "comprobante";
  comprobanteBox.innerHTML = `
    <h3>Comprobante de Venta (${nroComprobante})</h3>
    <p><strong>Fecha:</strong> ${fecha} | <strong>Forma de pago:</strong> ${formaPago}</p>
    <p><strong>Cliente:</strong> ${clienteNombre} (${tipoCliente})</p>
    <p><strong>Detalle:</strong> ${cant} fardos de 10 kg — Total: <strong>$${totalVenta.toLocaleString("es-AR")}</strong></p>
    <p><strong>Stock restante en depósito:</strong> ${stockFardos} fardos</p>
  `;

  inputCantidad.value = "";
  actualizarTotalEstimado();
});

btnLimpiar.addEventListener("click", () => {
  formVenta.reset();
  document.getElementById("fechaVenta").value = "2026-11-25";
  ocultarAlerta();
  comprobanteBox.className = "comprobante oculto";
  actualizarTotalEstimado();
});

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const caso = btn.dataset.caso;
    document.getElementById("vista-cu5").classList.toggle("oculto", caso !== "cu5");
    document.getElementById("vista-prox").classList.toggle("oculto", caso === "cu5");
  });
});

actualizarTotalEstimado();