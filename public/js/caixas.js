
const container = document.getElementById('caixa-list');

// Função para carregar o estado salvo
async function loadSelection() {
    const response = await fetch('/api/selection');
    const savedState = await response.json();
    for (let i = 1; i <= 25; i++) {
        const checkbox = document.getElementById(`caixa-${i}`);
        if (checkbox) {
            checkbox.checked = savedState[`caixa-${i}`] || false;
        }
    }
}

// Função para salvar o estado das seleções
async function saveSelection() {
    const selectionState = {};
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        selectionState[checkbox.id] = checkbox.checked;
    });
    await fetch('/api/selection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectionState)
    });
}

// Função para sincronizar alterações com todos os clientes
function syncSelectionState(newState) {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = newState[checkbox.id] || false;
    });
}

// Ouça alterações do servidor via EventSource
const eventSource = new EventSource('/events');
eventSource.onmessage = (event) => {
    const newState = JSON.parse(event.data);
    syncSelectionState(newState);
};

// Salve a seleção antes de sair da página
window.addEventListener('beforeunload', saveSelection);

// Cria a tabela com caixas de seleção
for (let i = 1; i <= 30; i++) {
    const caixaNumber = i.toString().padStart(2, '0');
    const caixaId = `SJSCX${caixaNumber}`;
    const caixaIp = `10.0.11.${10 + i}`;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="checkbox" id="caixa-${i}"></td>
        <td><label for="caixa-${i}">${caixaId}</label></td>
        <td>${caixaIp}</td>
    `;
    container.appendChild(row);
}

loadSelection();

// Adiciona event listener para atualizar o estado no servidor ao alterar as caixas
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSelection);
});