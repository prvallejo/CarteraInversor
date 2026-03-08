// Listener para los checks de interfaz
document.getElementById('check_monto').addEventListener('change', e => {
    document.getElementById('box_monto').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('check_apv').addEventListener('change', e => {
    document.getElementById('box_apv').style.display = e.target.checked ? 'block' : 'none';
});

let myChart = null;

function ejecutarSimulacion() {
    // 1. Inputs de perfil
    const sueldoBruto = parseFloat(document.getElementById('sueldo').value) || 0;
    const horizonte = parseInt(document.getElementById('horizonte').value);
    
    // 2. Inversión Inicial
    let capital = document.getElementById('check_monto').checked ? 
                  (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;

    // 3. APV
    const usaAPV = document.getElementById('check_apv').checked;
    const apvMonto = usaAPV ? parseFloat(document.getElementById('apv_monto').value) : 0;
    const apvTipo = document.getElementById('apv_tipo').value;

    // 4. Cartera Mensual
    const invCL = parseFloat(document.getElementById('inv_cl').value) || 0;
    const invUS = parseFloat(document.getElementById('inv_us').value) || 0;
    const invMM = parseFloat(document.getElementById('inv_mm').value) || 0;
    const inversionMensualTotal = invCL + invUS + invMM;

    // 5. Impuestos (IGC)
    const rentaLiquidaAnual = (sueldoBruto * 0.8) * 12;
    const baseTax = usaAPV && apvTipo === 'B' ? (rentaLiquidaAnual - (apvMonto * 12)) : rentaLiquidaAnual;
    const tasaIGC = calcularTasaIGC(baseTax);

    // Alerta APV (Solo si hay monto APV > 0)
    const zonaAlerta = document.getElementById('recomendacion-zona');
    zonaAlerta.innerHTML = "";
    if (usaAPV && apvMonto > 0) {
        if (tasaIGC >= 0.08 && apvTipo === 'A') {
            zonaAlerta.innerHTML = `<div class="alert-box"><strong>⚠️ Tip Fiscal:</strong> Por tu sueldo, el <b>Régimen B</b> te ahorraría más impuestos.</div>`;
        }
    }

    // 6. Ciclo de Simulación (Anualizado)
    let labels = [];
    let dataCapital = [];
    let tablaHTML = "";
    let totalTaxPagado = 0;

    for (let i = 1; i <= horizonte; i++) {
        // Rentabilidades ponderadas (Chile 9%, US 11%, MM 4.5%)
        // Simplificado: calculamos rendimientos sobre el capital acumulado
        let rentChile = capital * (invCL / (inversionMensualTotal || 1)) * 0.09;
        let rentUS = capital * (invUS / (inversionMensualTotal || 1)) * 0.11;
        let rentMM = capital * (invMM / (inversionMensualTotal || 1)) * 0.045;
        
        // Impuestos sobre dividendos/intereses (estimado 50% de la rentabilidad es div)
        let taxAnual = (rentChile * 0.5 * tasaIGC) + (rentUS * 0.5 * 0.15) + (rentMM * 0.5 * tasaIGC);
        totalTaxPagado += taxAnual;

        // Crecimiento: Inversión anual + Rentabilidades - Impuestos
        capital += (inversionMensualTotal * 12) + rentChile + rentUS + rentMM - taxAnual;

        // Bono APV A
        if (usaAPV && apvTipo === 'A') capital += Math.min((apvMonto * 12 * 0.15), 450000);

        labels.push("Año " + i);
        dataCapital.push(Math.round(capital));
        
        if (i % 5 === 0 || i === horizonte || i === 1) {
            tablaHTML += `<tr><td>${i}</td><td>$${Math.round(capital).toLocaleString('es-CL')}</td><td>$${(inversionMensualTotal*12).toLocaleString('es-CL')}</td><td>$${Math.round(taxAnual).toLocaleString('es-CL')}</td></tr>`;
        }
    }

    // Actualizar UI
    document.querySelector("#tax-table tbody").innerHTML = tablaHTML;
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString('es-CL')}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTaxPagado).toLocaleString('es-CL')}`;
    document.getElementById('fecha-reporte').innerText = `Simulación generada el: ${new Date().toLocaleDateString()}`;
    document.getElementById('pdf-btn').style.display = "block";
    
    renderChart(labels, dataCapital);
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
        data: { labels, datasets: [{ label: 'Patrimonio Neto (CLP)', data, borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// NUEVA FUNCIÓN PDF PRO
async function generarReportePRO() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Título y Colores
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("ESTRATEGIA PATRIMONIAL INVESTPRO", 15, 20);

    // Datos del Cliente
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text(`Fecha de Simulación: ${new Date().toLocaleDateString()}`, 15, 40);
    doc.text(`Sueldo Bruto Mensual: $${document.getElementById('sueldo').value}`, 15, 47);
    doc.text(`Horizonte: ${document.getElementById('horizonte').value} años`, 15, 54);

    // Resultados High-Level
    doc.setFontSize(14);
    doc.text("RESUMEN PROYECTADO", 15, 70);
    doc.setFontSize(12);
    doc.text(`Patrimonio Final: ${document.getElementById('res_total').innerText}`, 15, 78);
    doc.text(`Impuestos Totales Estimados: ${document.getElementById('res_tax').innerText}`, 15, 85);

    // Capturar Gráfico como imagen
    const canvas = document.getElementById('projectionChart');
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 15, 95, 180, 80);

    doc.setFontSize(10);
    doc.text("Nota: Esta proyección es una estimación basada en rentabilidades históricas y normativa vigente 2026.", 15, 185);

    doc.save(`Plan_InvestPro_${new Date().getTime()}.pdf`);
                                    }
