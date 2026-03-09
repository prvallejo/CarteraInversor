let myChart = null;

function toggleBox(id, el) {
    document.getElementById(id).style.display = el.checked ? 'block' : 'none';
}

function toggleReinversion() {
    const tipo = document.getElementById('apv_tipo').value;
    const box = document.getElementById('box_reinversion');
    if(box) box.style.visibility = (tipo === 'B') ? 'visible' : 'hidden';
}

function limpiarCampos() {
    document.querySelectorAll('input[type="number"]').forEach(i => i.value = "");
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.getElementById('check_apv').checked = true;
    document.getElementById('res_total').innerText = "$0";
    document.getElementById('res_ahorro_puro').innerText = "$0";
    document.getElementById('res_ganancia_neta').innerText = "$0";
    document.getElementById('musk-ratio').innerText = "";
    if (myChart) { myChart.destroy(); myChart = null; }
    toggleReinversion();
}

function ejecutarSimulacion() {
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    const apvMensual = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const reinvierteB = document.getElementById('check_reinversion').checked;
    const horizonte = parseInt(document.getElementById('horizonte').value);
    const rAnual = { 'A': 0.07, 'C': 0.05, 'E': 0.03 }[document.getElementById('apv_fondo').value] || 0.05;
    const tipoAPV = document.getElementById('apv_tipo').value;

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

        // Cálculo de Otros Activos con Recurrencia
        let otrosAnual = 0;
        const activos = [
            { id: 'inv_cl', rec: 'rec_cl' },
            { id: 'inv_us', rec: 'rec_us' },
            { id: 'inv_mm', rec: 'rec_mm' }
        ];

        activos.forEach(a => {
            let valor = parseFloat(document.getElementById(a.id).value) || 0;
            let esRecurrente = document.getElementById(a.rec).checked;
            if (esRecurrente) {
                otrosAnual += (valor * 12);
            } else if (i === 1) { // Solo se suma el primer año
                otrosAnual += (valor * 12);
            }
        });

        let aporteBolsillo = (apvMensual * 12) + otrosAnual;
        acumuladoBolsillo += aporteBolsillo;

        let inyeccionTotal = aporteBolsillo;
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

    // Update UI
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_ahorro_puro').innerText = `$${Math.round(acumuladoBolsillo).toLocaleString()}`;
    document.getElementById('res_ganancia_neta').innerText = `$${Math.round(capital - acumuladoBolsillo).toLocaleString()}`;
    document.getElementById('musk-ratio').innerText = `🚀 Ratio: +${((capital - acumuladoBolsillo)/acumuladoBolsillo*100).toFixed(1)}%`;
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
            datasets: [{ data: data, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true }]
        },
        options: { animation: false, responsive: true, maintainAspectRatio: false }
    });
}

function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const btn = document.querySelector('.btn-pdf');
    btn.style.display = 'none';
    
    // El truco para que no salga vacío: Forzar un render antes de capturar
    setTimeout(() => {
        html2pdf().set({
            margin: 10,
            filename: 'Reporte_InvestPro_v7.pdf',
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save().then(() => btn.style.display = 'block');
    }, 500);
}
