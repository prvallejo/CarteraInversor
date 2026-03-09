let myChart = null;

function ejecutarSimulacion() {
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = parseFloat(document.getElementById('monto_inicial').value) || 0;
    const apv = parseFloat(document.getElementById('apv_monto').value) || 0;
    const horizonte = parseInt(document.getElementById('horizonte').value);
    const fondo = document.getElementById('apv_fondo').value;

    const tasas = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const r = tasas[fondo];
    
    let capital = inicial;
    let totalTax = 0;
    let labels = [];
    let data = [];
    let tableBody = "";

    for (let i = 1; i <= horizonte; i++) {
        let renta = capital * r;
        let impuesto = (renta * 0.15); // Simplificado para el reporte
        totalTax += impuesto;
        capital += (apv * 12) + renta - impuesto;

        labels.push("Año " + i);
        data.push(Math.round(capital));

        if (i === 1 || i === 5 || i === horizonte) {
            tableBody += `<tr><td>${i}</td><td>$${Math.round(capital).toLocaleString()}</td><td>$${Math.round(renta).toLocaleString()}</td><td>$${Math.round(impuesto).toLocaleString()}</td></tr>`;
        }
    }

    // Actualizar Interfaz
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_retiro').innerText = `$${Math.round((capital * 0.04) / 12).toLocaleString()}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString()}`;
    document.querySelector("#tax-table tbody").innerHTML = tableBody;

    renderChart(labels, data);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Patrimonio',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function exportarPDF() {
    const element = document.getElementById('pdf-content');
    html2pdf().from(element).set({
        margin: 10,
        filename: 'Reporte_InvestPro.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
}
