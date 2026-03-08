const ACTIVOS = {
    'banco_chile': { ret: 0.095, div: 0.07, pais: 'CL' },
    'schd_us': { ret: 0.11, div: 0.035, pais: 'US' },
    'money_market': { ret: 0.048, div: 0, pais: 'CL' }
};

let myChart = null;

function ejecutarTodo() {
    const sueldoBruto = parseFloat(document.getElementById('sueldo').value) || 0;
    const monto = parseFloat(document.getElementById('monto').value) || 0;
    const horizonte = parseInt(document.getElementById('horizonte').value);
    const activo = ACTIVOS[document.getElementById('instrumento').value];
    const apvMonto = parseFloat(document.getElementById('apv_monto').value) || 0;
    const apvTipo = document.getElementById('apv_tipo').value;

    const rentaLiquidaAnual = (sueldoBruto * 0.8) * 12;
    const tasaIGC = calcularTasaIGC(rentaLiquidaAnual);

    const zonaAlerta = document.getElementById('recomendacion-zona');
    if (tasaIGC >= 0.08 && apvTipo === 'A') {
        zonaAlerta.innerHTML = `<div class="alert-box"><strong>⚠️ Tip de Experto:</strong> Tu tramo de impuesto es alto. El <b>Régimen B</b> te devolvería más dinero.</div>`;
    } else if (tasaIGC < 0.04 && apvTipo === 'B') {
        zonaAlerta.innerHTML = `<div class="alert-box" style="border-color:#238636; color:#238636; background:rgba(35,134,54,0.1)"><strong>💡 Tip de Experto:</strong> Pagas poco impuesto. El <b>Régimen A</b> te conviene por el bono estatal.</div>`;
    } else { zonaAlerta.innerHTML = ""; }

    let capital = monto;
    let tablaHTML = "";
    let labels = [], data = [];

    for (let i = 1; i <= horizonte; i++) {
        let divBrutos = capital * activo.div;
        let impuesto = (activo.pais === 'US') ? (divBrutos * 0.15) : (divBrutos * tasaIGC);
        let crecimiento = capital * (activo.ret - activo.div);
        
        capital += crecimiento + (divBrutos - impuesto);
        if (apvTipo === 'A') capital += Math.min((apvMonto * 12 * 0.15), 450000); 

        labels.push("Año " + i);
        data.push(Math.round(capital));
        if (i % 5 === 0 || i === horizonte) {
            tablaHTML += `<tr><td>Año ${i}</td><td>$${Math.round(capital).toLocaleString('es-CL')}</td><td>$${Math.round(divBrutos).toLocaleString('es-CL')}</td><td>$${Math.round(impuesto).toLocaleString('es-CL')}</td></tr>`;
        }
    }
    document.querySelector("#tax-table tbody").innerHTML = tablaHTML;
    document.getElementById('pdf-btn').style.display = "block";
    renderChart(labels, data);
}

function calcularTasaIGC(renta) {
    const UTM = 66500;
    const utmAnual = renta / UTM;
    if (utmAnual < 13.5) return 0;
    if (utmAnual < 30) return 0.04;
    return 0.08;
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Patrimonio Final (CLP)', data, borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.1)', fill: true, tension: 0.3 }] }
    });
}

function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Estrategia InvestPro", 20, 20);
    doc.setFontSize(12);
    doc.text(`Sueldo Mensual Bruto: $${document.getElementById('sueldo').value}`, 20, 40);
    doc.text(`Patrimonio Proyectado: ${document.querySelector('#tax-table tbody tr:last-child td:nth-child(2)').innerText}`, 20, 50);
    doc.text("Este reporte simula beneficios tributarios y crecimiento compuesto.", 20, 70);
    doc.save("Estrategia-Inversion.pdf");
    }
      
