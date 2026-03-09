document.getElementById('check_apv').addEventListener('change', e => {
    document.getElementById('box_apv').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('check_monto').addEventListener('change', e => {
    document.getElementById('box_monto').style.display = e.target.checked ? 'block' : 'none';
});

let myChart = null;

function ejecutarSimulacion() {
    const getV = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    // 1. Datos Base
    const sueldoBruto = getV('sueldo');
    const horizonte = parseInt(document.getElementById('horizonte').value);
    let capital = document.getElementById('check_monto').checked ? getV('monto_inicial') : 0;

    // 2. Configuración APV
    const usaAPV = document.getElementById('check_apv').checked;
    const apvMontoMensual = usaAPV ? getV('apv_monto') : 0;
    const apvTipo = document.getElementById('apv_tipo').value;
    const fondoLetra = document.getElementById('apv_fondo').value;

    // 3. Matriz de Rentabilidades REALES (Ajustadas)
    const TASAS = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const rentabilidadSeleccionada = TASAS[fondoLetra]; 

    // 4. Lógica Tributaria Real
    const rentaLiquidaAnual = (sueldoBruto * 0.8) * 12;
    const tasaIGC = calcularTasaIGC(rentaLiquidaAnual);

    // 5. Alerta de Conveniencia (Lógica de Ingeniería)
    const alerta = document.getElementById('recomendacion-zona');
    alerta.innerHTML = "";
    if (usaAPV && apvMontoMensual > 0) {
        // Si la tasa de impuesto es menor al 15%, conviene el Régimen A (Bono)
        if (tasaIGC < 0.15) {
            alerta.innerHTML = `<div class="alert-box" style="border-color:#10b981; color:#065f46; background:#ecfdf5">✅ <b>Régimen A Ganador:</b> Tu tasa de impuesto es baja (${(tasaIGC*100).toFixed(1)}%). El bono del 15% fiscal es superior a tu ahorro tributario.</div>`;
        } else {
            alerta.innerHTML = `<div class="alert-box">🚀 <b>Régimen B Sugerido:</b> Tu tasa marginal es del ${(tasaIGC*100).toFixed(1)}%. Al sumarse a otros beneficios, el Régimen B optimiza mejor tu base imponible.</div>`;
        }
    }

    let labels = [], data = [];
    let tablaHTML = "";
    let totalTax = 0;
    let rentabilidadAcumuladaTotal = 0;

    // 6. Ciclo de Simulación Año a Año
    for (let i = 1; i <= horizonte; i++) {
        // Rentabilidad del capital que ya existe
        let rentaDelAño = capital * rentabilidadSeleccionada;
        rentabilidadAcumuladaTotal += rentaDelAño;

        // Impuesto (Solo sobre renta de activos, no sobre el ahorro APV B)
        let impuestoAño = (rentaDelAño * 0.4 * tasaIGC); 
        totalTax += impuestoAño;

        // Inyección de capital (Ahorro Anual)
        let ahorroAnualAPV = apvMontoMensual * 12;
        
        capital += ahorroAnualAPV + rentaDelAño - impuestoAño;

        // Sumar Bono Fiscal si es Régimen A (al final del año)
        if (usaAPV && apvTipo === 'A') {
            let bonoA = Math.min(ahorroAnualAPV * 0.15, 465000); // Tope ~6 UTM
            capital += bonoA;
        }

        labels.push("Año " + i);
        data.push(Math.round(capital));
        
        if (i % 5 === 0 || i === horizonte || i === 1) {
            tablaHTML += `<tr><td>${i}</td><td>$${Math.round(capital).toLocaleString('es-CL')}</td><td>$${Math.round(rentaDelAño).toLocaleString('es-CL')}</td><td>$${Math.round(impuestoAño).toLocaleString('es-CL')}</td></tr>`;
        }
    }

    // 7. Salida a Interfaz
    const retiroSeguro = (capital * 0.04) / 12;
    document.querySelector("#tax-table tbody").innerHTML = tablaHTML;
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString('es-CL')}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString('es-CL')}`;
    document.getElementById('res_retiro').innerText = `$${Math.round(retiroSeguro).toLocaleString('es-CL')}`;
    
    renderChart(labels, data);
}

function calcularTasaIGC(rentaAnual) {
    const UTM = 66500;
    const utmAnual = rentaAnual / UTM;
    if (utmAnual <= 13.5) return 0;
    if (utmAnual <= 30) return 0.04;
    if (utmAnual <= 50) return 0.08;
    if (utmAnual <= 70) return 0.135;
    if (utmAnual <= 90) return 0.23;
    return 0.35;
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Patrimonio', data, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
