// Manejo de Interfaz Dinámica
document.getElementById('check_apv').addEventListener('change', e => {
    document.getElementById('box_apv').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('check_monto').addEventListener('change', e => {
    document.getElementById('box_monto').style.display = e.target.checked ? 'block' : 'none';
});

let myChart = null;

function ejecutarSimulacion() {
    const getV = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    // 1. Inputs Base
    const sueldoBruto = getV('sueldo');
    const horizonte = parseInt(document.getElementById('horizonte').value);
    const inicial = document.getElementById('check_monto').checked ? getV('monto_inicial') : 0;
    const extraMensual = document.getElementById('check_monto').checked ? getV('inv_mensual') : 0;

    // 2. APV Config
    const usaAPV = document.getElementById('check_apv').checked;
    const apvMonto = usaAPV ? getV('apv_monto') : 0;
    const apvTipo = document.getElementById('apv_tipo').value;
    const fondo = document.getElementById('apv_fondo').value;

    // Rentabilidades Reales (Netas de Inflación)
    const RENTAS = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const rentAPV = RENTAS[fondo];
    const rentOtros = 0.045; // Rentabilidad moderada para otros activos

    // 3. Lógica Tributaria (Impuesto Segunda Categoría / IGC)
    const rentaLiquida = (sueldoBruto * 0.8) * 12;
    const tasaIGC = calcularTasaIGC(rentaLiquida);

    // Alerta Inteligente
    const alerta = document.getElementById('recomendacion-zona');
    alerta.innerHTML = "";
    if (usaAPV && apvMonto > 0) {
        if (tasaIGC >= 0.08 && apvTipo === 'A') {
            alerta.innerHTML = `<div class="alert-box">🚀 <b>Estrategia B recomendada:</b> Tu tasa de impuesto (${tasaIGC*100}%) hace que el beneficio fiscal del Régimen B sea superior al bono estatal del A.</div>`;
        }
    }

    // 4. Ciclo de Cálculo
    let capital = inicial;
    let totalTax = 0;
    let labels = [], data = [];
    let tablaHTML = "";

    for (let i = 1; i <= horizonte; i++) {
        // Rentabilidad del capital existente
        let rentaAño = (capital * rentOtros);
        
        // Impuesto sobre rentabilidad (estimado 40% tributable)
        let taxAnual = (rentaAño * 0.4 * tasaIGC);
        totalTax += taxAnual;

        // Nuevos flujos: Ahorro Extra + APV
        let ahorroAño = (extraMensual * 12) + (apvMonto * 12);
        
        // Rentabilidad específica del APV (aplicada al flujo del año)
        let rentaAPVCompuesto = (apvMonto * 12) * (rentAPV / 2); // Simplificación lineal primer año

        capital += rentaAño + ahorroAño + rentaAPVCompuesto - taxAnual;

        // Bono APV A
        if (usaAPV && apvTipo === 'A' && apvMonto > 0) {
            capital += Math.min((apvMonto * 12 * 0.15), 460000); 
        }

        labels.push("Año " + i);
        data.push(Math.round(capital));
        
        if (i % 5 === 0 || i === horizonte) {
            tablaHTML += `<tr><td>${i}</td><td>$${Math.round(capital).toLocaleString('es-CL')}</td><td>$${Math.round(rentaAño).toLocaleString('es-CL')}</td><td>$${Math.round(taxAnual).toLocaleString('es-CL')}</td></tr>`;
        }
    }

    // 5. Resultados de Libertad Financiera
    const retiroSeguro = (capital * 0.04) / 12; // Regla del 4%

    document.querySelector("#tax-table tbody").innerHTML = tablaHTML;
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString('es-CL')}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString('es-CL')}`;
    document.getElementById('res_retiro').innerText = `$${Math.round(retiroSeguro).toLocaleString('es-CL')}`;
    document.getElementById('pdf-btn').style.display = "block";
    
    renderChart(labels, data);
}

function calcularTasaIGC(renta) {
    const UTM = 66500;
    const utmAnual = renta / UTM;
    if (utmAnual < 13.5) return 0;
    if (utmAnual < 30) return 0.04;
    if (utmAnual < 50) return 0.08;
    return 0.135;
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Capital CLP', data, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
        }
