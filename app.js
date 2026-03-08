document.getElementById('check_monto').addEventListener('change', e => {
    document.getElementById('box_monto').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('check_apv').addEventListener('change', e => {
    document.getElementById('box_apv').style.display = e.target.checked ? 'block' : 'none';
});

let myChart = null;

function ejecutarSimulacion() {
    // Captura segura de datos (maneja vacíos como 0)
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    const sueldoBruto = getVal('sueldo');
    const horizonte = parseInt(document.getElementById('horizonte').value);
    
    let capital = document.getElementById('check_monto').checked ? getVal('monto_inicial') : 0;

    const usaAPV = document.getElementById('check_apv').checked;
    const apvMonto = usaAPV ? getVal('apv_monto') : 0;
    const apvTipo = document.getElementById('apv_tipo').value;

    const invCL = getVal('inv_cl');
    const invUS = getVal('inv_us');
    const invMM = getVal('inv_mm');
    const ahorroMensualActivos = invCL + invUS + invMM;

    // Lógica Tributaria Real (Tramo IGC)
    const rentaLiquidaAnual = (sueldoBruto * 0.8) * 12;
    const tasaIGC = calcularTasaIGC(rentaLiquidaAnual);

    // ALERTA TRIBUTARIA CORREGIDA
    const zonaAlerta = document.getElementById('recomendacion-zona');
    zonaAlerta.innerHTML = "";
    // Solo alertar si hay APV activo y el sueldo justifica el Régimen B (tasa > 4%)
    if (usaAPV && apvMonto > 0) {
        if (tasaIGC >= 0.08 && apvTipo === 'A') {
            zonaAlerta.innerHTML = `<div class="alert-box"><strong>⚠️ Optimización B:</strong> Tu tasa de impuesto es del ${Math.round(tasaIGC*100)}%. El <b>Régimen B</b> te ahorraría más que el bono del 15%.</div>`;
        } else if (tasaIGC <= 0.04 && apvTipo === 'B') {
            zonaAlerta.innerHTML = `<div class="alert-box"><strong>💡 Sugerencia A:</strong> Como pagas poco impuesto, el <b>Régimen A</b> es más eficiente por el bono estatal directo.</div>`;
        }
    }

    let labels = [], dataCapital = [];
    let tablaHTML = "";
    let totalTax = 0;

    // MOTOR DE CÁLCULO v3.2026
    for (let i = 1; i <= horizonte; i++) {
        // 1. Definir proporciones de la cartera (si todo es 0, MM es el default para rentar algo)
        let totalFlujo = ahorroMensualActivos || 1; 
        let propCL = invCL / totalFlujo;
        let propUS = invUS / totalFlujo;
        let propMM = ahorroMensualActivos === 0 ? 1 : invMM / totalFlujo;

        // 2. Rentabilidad del Capital Acumulado (EL ERROR ESTABA AQUÍ)
        // Aplicamos rentabilidades ponderadas al capital que YA existe + los nuevos ahorros
        let rentAnualChile = capital * 0.09 * propCL;
        let rentAnualUS = capital * 0.11 * propUS;
        let rentAnualMM = capital * 0.045 * propMM;
        let rentabilidadBrutaTotal = rentAnualChile + rentAnualUS + rentAnualMM;

        // 3. Impuestos anuales sobre rentabilidad (estimando dividendos)
        let impuestoAño = (rentAnualChile * 0.4 * tasaIGC) + (rentAnualUS * 0.4 * 0.15) + (rentAnualMM * 0.4 * tasaIGC);
        totalTax += impuestoAño;

        // 4. Actualización de Capital
        // Capital = Capital Anterior + Ahorro Nuevo (Activos + APV) + Rentas - Impuestos
        capital += (ahorroMensualActivos * 12) + (apvMonto * 12) + rentabilidadBrutaTotal - impuestoAño;

        // 5. Bono Fiscal APV A (Si aplica)
        if (usaAPV && apvTipo === 'A' && apvMonto > 0) {
            capital += Math.min((apvMonto * 12 * 0.15), 455000); // Tope 6 UTM aprox
        }

        labels.push("Año " + i);
        dataCapital.push(Math.round(capital));
        
        if (i <= 5 || i % 5 === 0 || i === horizonte) {
            tablaHTML += `<tr><td>${i}</td><td>$${Math.round(capital).toLocaleString('es-CL')}</td><td>$${Math.round(rentabilidadBrutaTotal).toLocaleString('es-CL')}</td><td>$${Math.round(impuestoAño).toLocaleString('es-CL')}</td></tr>`;
        }
    }

    // UI Update
    document.querySelector("#tax-table tbody").innerHTML = tablaHTML;
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString('es-CL')}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString('es-CL')}`;
    document.getElementById('fecha-reporte').innerText = `Proyección al ${new Date().toLocaleDateString()}`;
    document.getElementById('pdf-btn').style.display = "block";
    
    renderChart(labels, dataCapital);
}

function calcularTasaIGC(renta) {
    const UTM = 66500;
    const utmAnual = renta / UTM;
    if (utmAnual < 13.5) return 0;
    if (utmAnual < 30) return 0.04;
    if (utmAnual < 50) return 0.08;
    if (utmAnual < 70) return 0.135;
    return 0.23;
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Patrimonio Neto', data, borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,0.05)', fill: true, tension: 0.4, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function generarReportePRO() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE ESTRATEGIA PATRIMONIAL", 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Patrimonio Final Proyectado: ${document.getElementById('res_total').innerText}`, 20, 40);
    doc.text(`Impuestos Totales Estimados: ${document.getElementById('res_tax').innerText}`, 20, 50);
    doc.text("------------------------------------------------------------------", 20, 60);
    doc.text("Nota: Simulación basada en tasas impositivas y rentabilidades proyectadas v3.2026.", 20, 70);
    
    // Captura el gráfico (opcional, jsPDF básico no captura canvas directamente sin html2canvas, 
    // pero incluimos los datos clave por ahora)
    doc.save("Plan_InvestPro_32026.pdf");
    }
