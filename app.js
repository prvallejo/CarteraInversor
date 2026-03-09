let myChart = null;

window.onload = function() { toggleReinversion(); };

function toggleBox(id, el) {
    const box = document.getElementById(id);
    if (box) box.style.display = el.checked ? 'block' : 'none';
}

function toggleReinversion() {
    const tipo = document.getElementById('apv_tipo').value;
    const box = document.getElementById('box_reinversion');
    if(box) box.style.display = (tipo === 'B') ? 'flex' : 'none';
}

function ejecutarSimulacion() {
    // 1. CAPTURA
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    const apvMensual = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const reinvierteB = document.getElementById('check_reinversion') ? document.getElementById('check_reinversion').checked : false;
    const otros = (parseFloat(document.getElementById('inv_cl').value) || 0) + (parseFloat(document.getElementById('inv_us').value) || 0) + (parseFloat(document.getElementById('inv_mm').value) || 0);
    const horizonte = parseInt(document.getElementById('horizonte').value);
    const tasas = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const rAnual = tasas[document.getElementById('apv_fondo').value] || 0.05;
    const tipoAPV = document.getElementById('apv_tipo').value;

    // 2. CÁLCULO
    let capital = inicial;
    let acumuladoBolsillo = inicial; 
    let totalTax = 0;
    let labels = [];
    let data = [];
    let tableBody = "";

    for (let i = 1; i <= horizonte; i++) {
        let rentaAnual = capital * rAnual;
        let impuesto = (rentaAnual * 0.15); 
        totalTax += impuesto;
        let aporteBolsilloAnual = (apvMensual + otros) * 12;
        acumuladoBolsillo += aporteBolsilloAnual;
        let inyeccionTotal = aporteBolsilloAnual;
        if (document.getElementById('check_apv').checked) {
            if (tipoAPV === 'A') inyeccionTotal += (apvMensual * 12 * 0.15);
            if (tipoAPV === 'B' && reinvierteB) inyeccionTotal += (apvMensual * 12 * 0.25);
        }
        capital += inyeccionTotal + rentaAnual - impuesto;
        labels.push("Año " + i);
        data.push(Math.round(capital));
        if (i === 1 || i % 5 === 0 || i === horizonte) {
            tableBody += `<tr><td>Año ${i}</td><td>$${Math.round(capital).toLocaleString()}</td><td>$${Math.round(rentaAnual).toLocaleString()}</td><td>$${Math.round(impuesto).toLocaleString()}</td></tr>`;
        }
    }

    // 3. RENDER PANTALLA
    const plusvalia = capital - acumuladoBolsillo;
    const ratio = (acumuladoBolsillo > 0) ? (plusvalia / acumuladoBolsillo) * 100 : 0;

    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_retiro').innerText = `$${Math.round((capital * 0.04) / 12).toLocaleString()}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString()}`;
    document.getElementById('res_ahorro_puro').innerText = `$${Math.round(acumuladoBolsillo).toLocaleString()}`;
    document.getElementById('res_ganancia_neta').innerText = `$${Math.round(plusvalia).toLocaleString()}`;
    document.getElementById('musk-ratio').innerText = `🚀 Ratio de Ganancia: +${ratio.toFixed(1)}% sobre capital propio.`;

    document.querySelector("#tax-table tbody").innerHTML = tableBody;
    document.getElementById('fecha-reporte').innerText = "Simulación: " + new Date().toLocaleDateString();

    renderChart(labels, data);
    gestionarAlerta(sueldo, tipoAPV);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function gestionarAlerta(sueldo, tipo) {
    const alerta = document.getElementById('alerta-regimen');
    if (!alerta) return;
    const convieneB = (sueldo > 4000000);
    alerta.style.display = 'block';
    alerta.className = "alerta-box " + ((convieneB && tipo === 'B') || (!convieneB && tipo === 'A') ? "alerta-success" : "alerta-warning");
    alerta.innerHTML = (convieneB && tipo === 'B') || (!convieneB && tipo === 'A') ? `<strong>✅ Estrategia Óptima</strong>` : `<strong>⚠️ Sugerencia de Cambio</strong>`;
}

// FIX DEFINITIVO PARA PDF
function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const btn = document.querySelector('.btn-pdf');
    const chartBox = document.querySelector('.chart-box');
    
    // 1. Preparar visual para captura
    btn.style.visibility = 'hidden';
    chartBox.style.height = '350px'; 

    // 2. Forzar un pequeño delay para que el navegador "asiente" los valores
    setTimeout(() => {
        const opt = {
            margin: [10, 5],
            filename: 'InvestPro_Reporte_Final.pdf',
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                logging: false,
                letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            btn.style.visibility = 'visible';
            chartBox.style.height = '250px';
        });
    }, 500); // 500ms es el "tiempo de seguridad"
}
