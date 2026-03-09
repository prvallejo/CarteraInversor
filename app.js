let myChart = null;

// Función para mostrar/ocultar cajas (Checks)
function toggleBox(id, el) {
    document.getElementById(id).style.display = el.checked ? 'block' : 'none';
}

function ejecutarSimulacion() {
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    const apv = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const horizonte = parseInt(document.getElementById('horizonte').value);
    const fondo = document.getElementById('apv_fondo').value;
    const tipoAPV = document.getElementById('apv_tipo').value;

    const tasas = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const r = tasas[fondo];
    
    let capital = inicial;
    let totalTax = 0;
    let labels = [];
    let data = [];
    let tableBody = "";

    // Lógica de alerta Régimen
    const alerta = document.getElementById('alerta-regimen');
    if (sueldo > 4000000) {
        alerta.innerHTML = "<strong>💡 Recomendación Técnica:</strong> Su sueldo está en tramos altos. El <strong>Régimen B</strong> es óptimo para rebajar su base imponible actual.";
        alerta.style.display = 'block';
    } else {
        alerta.innerHTML = "<strong>💡 Recomendación Técnica:</strong> Para su nivel de renta, el <strong>Régimen A</strong> (Bono fiscal del 15%) suele ser más rentable.";
        alerta.style.display = 'block';
    }

    for (let i = 1; i <= horizonte; i++) {
        let rentaAnual = capital * r;
        let impuesto = (rentaAnual * 0.15); // Factorización de Global Complementario
        totalTax += impuesto;
        
        // Aportes anuales
        let aportes = apv * 12;
        if (tipoAPV === 'A') aportes += (aportes * 0.15); // Bono estatal
        
        capital += aportes + rentaAnual - impuesto;

        labels.push("Año " + i);
        data.push(Math.round(capital));

        if (i === 1 || i % 5 === 0 || i === horizonte) {
            tableBody += `<tr><td>${i}</td><td>$${Math.round(capital).toLocaleString()}</td><td>$${Math.round(rentaAnual).toLocaleString()}</td><td>$${Math.round(impuesto).toLocaleString()}</td></tr>`;
        }
    }

    // Mostrar resultados
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
                label: 'Crecimiento de Patrimonio',
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
        filename: 'Estrategia_Patrimonial.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
}
