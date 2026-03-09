let myChart = null;

// Función para Resetear Todo
function limpiarCampos() {
    // 1. Limpiar todos los inputs numéricos y select
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => input.value = "");
    
    // 2. Resetear Checkboxes
    document.getElementById('check_monto').checked = false;
    document.getElementById('check_apv').checked = true;
    toggleBox('box_monto', document.getElementById('check_monto'));
    
    // 3. Volver valores visuales a $0
    const values = ['res_total', 'res_retiro', 'res_tax', 'res_ahorro_puro', 'res_ganancia_neta'];
    values.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = "$0";
    });
    
    document.getElementById('musk-ratio').innerText = "";
    document.getElementById('alerta-regimen').style.display = 'none';
    document.querySelector("#tax-table tbody").innerHTML = "";

    // 4. Destruir Gráfico
    if (myChart) {
        myChart.destroy();
        myChart = null;
    }
    
    console.log("Campos reseteados con éxito.");
}

function ejecutarSimulacion() {
    // [Mantenemos la lógica de captura de datos igual a la v6.2]
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    const apvMensual = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const reinvierteB = document.getElementById('check_reinversion') ? document.getElementById('check_reinversion').checked : false;
    const otros = (parseFloat(document.getElementById('inv_cl').value) || 0) + (parseFloat(document.getElementById('inv_us').value) || 0) + (parseFloat(document.getElementById('inv_mm').value) || 0);
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

    // Actualización Visual
    const plusvalia = capital - acumuladoBolsillo;
    const ratio = (acumuladoBolsillo > 0) ? (plusvalia / acumuladoBolsillo) * 100 : 0;

    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_retiro').innerText = `$${Math.round((capital * 0.04) / 12).toLocaleString()}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString()}`;
    document.getElementById('res_ahorro_puro').innerText = `$${Math.round(acumuladoBolsillo).toLocaleString()}`;
    document.getElementById('res_ganancia_neta').innerText = `$${Math.round(plusvalia).toLocaleString()}`;
    document.getElementById('musk-ratio').innerText = `🚀 Ratio de Ganancia: +${ratio.toFixed(1)}% sobre capital propio.`;

    document.querySelector("#tax-table tbody").innerHTML = tableBody;
    renderChart(labels, data);
}

// FIX DE EXPORTACIÓN CON RE-RENDER
function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const btnPdf = document.querySelector('.btn-pdf');
    const btnReset = document.querySelector('.btn-reset');
    
    // Ocultar botones para que no salgan en el PDF
    if(btnPdf) btnPdf.style.display = 'none';
    if(btnReset) btnReset.style.display = 'none';

    // Pequeño delay para asegurar que el DOM está actualizado con los valores de Musk
    setTimeout(() => {
        const opt = {
            margin: [10, 5],
            filename: 'Reporte_InvestPro_Elite.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            if(btnPdf) btnPdf.style.display = 'block';
            if(btnReset) btnReset.style.display = 'block';
        });
    }, 800); 
}

// [Funciones toggle y renderChart se mantienen iguales]
        
