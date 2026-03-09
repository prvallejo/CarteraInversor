document.getElementById('check_apv').addEventListener('change', e => {
    document.getElementById('box_apv').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('check_monto').addEventListener('change', e => {
    document.getElementById('box_monto').style.display = e.target.checked ? 'block' : 'none';
});

let myChart = null;

function ejecutarSimulacion() {
    const getV = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    // 1. Perfil
    const sueldoBruto = getV('sueldo');
    const horizonte = parseInt(document.getElementById('horizonte').value);
    
    // 2. Inversión Inicial
    let capital = document.getElementById('check_monto').checked ? getV('monto_inicial') : 0;

    // 3. APV
    const usaAPV = document.getElementById('check_apv').checked;
    const apvMonto = usaAPV ? getV('apv_monto') : 0;
    const apvTipo = document.getElementById('apv_tipo').value;
    const fondo = document.getElementById('apv_fondo').value;

    // 4. Activos Mensuales
    const invCL = getV('inv_cl');
    const invUS = getV('inv_us');
    const invMM = getV('inv_mm');
    const ahorroTotalActivos = invCL + invUS + invMM;

    // Rentabilidades
    const RENTAS_APV = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const rentAPV = RENTAS_APV[fondo];
    
    // Calculamos rentabilidad ponderada para otros activos
    const rentOtros = (invCL * 0.09 + invUS * 0.11 + invMM * 0.045 + (ahorroTotalActivos === 0 ? capital * 0.045 : 0)) / (ahorroTotalActivos + (ahorroTotalActivos === 0 ? capital : 0) || 1);

    // Impuestos
    const rentaLiquida = (sueldoBruto * 0.8) * 12;
    const tasaIGC = calcularTasaIGC(rentaLiquida);

    const alerta = document.getElementById('recomendacion-zona');
    alerta.innerHTML = "";
    if (usaAPV && apvMonto > 0) {
        if (tasaIGC >= 0.08 && apvTipo === 'A') {
            alerta.innerHTML = `<div class="alert-box">💡 <b>Optimización:</b> Con tu sueldo, el <b>Régimen B</b> te ahorra un ${Math.round(tasaIGC*100)}% en impuestos, superando al bono del A.</div>`;
        } else if (tasaIGC < 0.04 && apvTipo === 'B') {
            alerta.innerHTML = `<div class="alert-box" style="border-color:#10b981; color:#065f46; background:#ecfdf5">✅ <b>Sugerencia:</b> El <b>Régimen A</b> es mejor para tu tramo actual.</div>`;
        }
    }

    let labels = [], data = [];
    let tablaHTML = "";
    let totalTax = 0;

    for (let i = 1; i <= horizonte; i++) {
        let rentaAño = (capital * rentOtros);
        let taxAnual = (rentaAño * 0.45 * tasaIGC) + (invUS > 0 ? capital * 0.015 : 0); // Estimación simplificada tax
        totalTax += taxAnual;

        // Inversión año: Activos + APV
        capital += (ahorroTotalActivos * 12) + (apvMonto * 12) + rentaAño - taxAnual;

        // Bono APV A
        if (usaAPV && apvTipo === 'A' && apvMonto > 0) {
            capital += Math.min((apvMonto * 12 * 0.15), 460000); 
        }

        labels.push("Año " + i);
        data.push(Math.round(capital));
        
        if (i <= 5 || i % 5 === 0 || i === horizonte) {
            tablaHTML += `<tr><td>${i}</td><td>$${Math.round(capital).toLocaleString('es-CL')}</td><td>$${Math.round(rentaAño).toLocaleString('es-CL')}</td><td>$${Math.round(taxAnual).toLocaleString('es-CL')}</td></tr>`;
        }
    }

    const retiroSeguro = (capital * 0.04) / 12;

    document.querySelector("#tax-table tbody").innerHTML = tablaHTML;
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString('es-CL')}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString('es-CL')}`;
    document.getElementById('res_retiro').innerText = `$${Math.round(retiroSeguro).toLocaleString('es-CL')}`;
    document.getElementById('fecha-reporte').innerText = `Proyección al ${new Date().toLocaleDateString()}`;
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
        data: { labels, datasets: [{ label: 'Patrimonio Total', data, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
                                                                                     }
