window.CocoRootRelatoriosExport = {
    exportCsv: (data, periodSelect, focusSelect, round) => {
        const periodLabel = periodSelect?.selectedOptions?.[0]?.textContent?.trim() || periodSelect?.value || '30d';
        const focusLabel = focusSelect?.selectedOptions?.[0]?.textContent?.trim() || focusSelect?.value || 'geral';
        const rows = [
            ['Metrica', 'Valor'],
            ['Periodo', periodLabel],
            ['Foco', focusLabel],
            ['Produtividade', data.produtividade],
            ['Eficiencia da rega', data.rega],
            ['Tarefas concluidas', data.tarefas],
            ['Performance global', `${round(data.performanceScore)}%`],
            [''],
            ['Serie', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
            ['Linha', ...data.line.map((v) => `${round(v)}%`)],
            ['Barras', ...data.bars.map((v) => `${round(v)}%`)],
        ];
        const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-cocoroot-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },

    exportPdf: (data, periodSelect, focusSelect, round) => {
        const periodLabel = periodSelect?.selectedOptions?.[0]?.textContent?.trim() || periodSelect?.value || '30d';
        const focusLabel = focusSelect?.selectedOptions?.[0]?.textContent?.trim() || focusSelect?.value || 'geral';
        const popup = window.open('', '_blank', 'width=900,height=700');
        if (!popup) return;
        popup.document.write(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Relatório CocoRoot</title>
                <style>
                    body{font-family:Arial,sans-serif;padding:24px;color:#1b1b1b}
                    h1{margin:0 0 8px}
                    .meta{color:#4c4c4c;margin-bottom:18px}
                    .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
                    .card{border:1px solid #d6e4d2;border-radius:10px;padding:10px}
                    .k{font-size:12px;color:#667}
                    .v{font-size:24px;font-weight:700;margin-top:6px}
                    ul{line-height:1.7}
                </style>
            </head>
            <body>
                <h1>Relatório Detalhado</h1>
                <div class="meta">Período: ${periodLabel} · Foco: ${focusLabel}</div>
                <div class="cards">
                    <div class="card"><div class="k">Produtividade</div><div class="v">${data.produtividade}</div></div>
                    <div class="card"><div class="k">Eficiência da Rega</div><div class="v">${data.rega}</div></div>
                    <div class="card"><div class="k">Tarefas Concluídas</div><div class="v">${data.tarefas}</div></div>
                </div>
                <div><strong>Performance Global:</strong> ${round(data.performanceScore)}%</div>
                <h3>Resumo</h3>
                <ul>${data.summary.map((line) => `<li>${line}</li>`).join('')}</ul>
                <h3>Indicadores por bloco</h3>
                <div>Linha: ${data.line.map((v) => `${round(v)}%`).join(' · ')}</div>
                <div>Barras: ${data.bars.map((v) => `${round(v)}%`).join(' · ')}</div>
            </body>
            </html>
        `);
        popup.document.close();
        popup.focus();
        popup.print();
    }
};
