const db = require('./db');
const express = require('express');
const ping = require('ping');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('json2csv');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 80;
const csvFilePath = path.join(__dirname, 'sjsips.csv');

// Configuração da sessão
app.use(session({
    secret: 'seu-segredo-aqui', // Altere para um segredo seguro
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Defina como true se usar HTTPS
}));

// Middleware para servir arquivos estáticos (CSS, JS, imagens) sem autenticação
app.use('/public', express.static(path.join(__dirname, 'public')));

// Middleware de autenticação
const authenticateSession = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
};

// Middleware para proteger rotas HTML
const serveHtmlWithAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
};

// Rota para servir arquivos HTML com autenticação
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.get('/home', serveHtmlWithAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home', 'index.html'));
});

app.get('/caixas', serveHtmlWithAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'caixas', 'index.html'));
});

app.get('/router', serveHtmlWithAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'router', 'index.html'));
});

// Rota para logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Erro ao sair');
        }
        res.redirect('/');
    });
});

// Rota para autenticação e login
app.post('/login', express.json(), (req, res) => {
    try {
        const { username, password } = req.body;
        if (username === 'jorge' && password === 'jbatistasjs') {
            req.session.user = username;
            res.json({ success: true, redirect: '/home' });
        } else {
            res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }
    } catch (error) {
        console.error('Error processing login:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Middleware para proteger as rotas que requerem autenticação
app.use('/api', authenticateSession);
app.use('/events', authenticateSession);
app.use('/update-csv', authenticateSession);

// Função para carregar dados da tabela Roteadores
const loadRoteadoresData = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Roteadores', (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Rota para obter os dados de Wifi e Senha
app.get('/api/wifi-senha', async (req, res) => {
    try {
        const data = await loadRoteadoresData();
        const wifiSenhaData = data.map(item => ({
            IP: item.IP,
            Rede: item.SSID || '',
            Senha: item.SSIDPASS || ''
        }));
        res.json(wifiSenhaData);
    } catch (error) {
        console.error('Error in /api/wifi-senha route:', error);
        res.status(500).json({ error: 'Error loading WiFi and password data' });
    }
});

// Rota para obter os dados de Login e Senha
app.get('/api/login-senha', async (req, res) => {
    try {
        const data = await loadRoteadoresData();
        const loginSenhaData = data.map(item => ({
            IP: item.IP,
            Login: item.User || '',
            Senha: item.USERPASS || ''
        }));
        res.json(loginSenhaData);
    } catch (error) {
        console.error('Error in /api/login-senha route:', error);
        res.status(500).json({ error: 'Error loading login and password data' });
    }
});

// Rota para obter os dados de Fabricante e MAC
app.get('/api/fabricante-mac', async (req, res) => {
    try {
        const data = await loadRoteadoresData();
        const fabricanteMacData = data.map(item => ({
            IP: item.IP,
            Fabricante: item.FAB || '',
            MAC: item.Mac || ''
        }));
        res.json(fabricanteMacData);
    } catch (error) {
        console.error('Error in /api/fabricante-mac route:', error);
        res.status(500).json({ error: 'Error loading manufacturer and MAC data' });
    }
});


// Função para carregar dados da planilha CSV
const loadData = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM devices', (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

let selectionState = {};
let clients = []; // Lista de clientes conectados para enviar atualizações

app.get('/api/selection', (req, res) => {
    res.json(selectionState);
});

app.post('/api/selection', express.json(), (req, res) => {
    selectionState = req.body;
    res.sendStatus(200);
    // Envia a atualização para todos os clientes conectados
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify(selectionState)}\n\n`);
    });
});

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const client = { res };
    clients.push(client);

    // Envia o estado atual para o cliente
    res.write(`data: ${JSON.stringify(selectionState)}\n\n`);

    req.on('close', () => {
        clients = clients.filter(c => c !== client);
    });
});

// Função para verificar o status dos IPs
const checkIpsStatus = async (ips) => {
    try {
        const statusPromises = ips.map(ip => ping.promise.probe(ip));
        const results = await Promise.all(statusPromises);
        return results;
    } catch (error) {
        console.error('Error checking IP status:', error);
        throw error;
    }
};

// Rota para obter os dados do CSV
app.get('/data', async (req, res) => {
    try {
        const data = await loadData();
        res.json(data);
    } catch (error) {
        console.error('Error in /data route:', error);
        res.status(500).json({ error: 'Error loading data' });
    }
});

// Rota para obter o status dos IPs
app.get('/status', async (req, res) => {
    try {
        const data = await loadData();
        const ips = data.map(item => item.IP);
        const statusResults = await checkIpsStatus(ips);

        const updatedData = data.map((item, index) => ({
            ...item,
            Status: statusResults[index].alive ? 'Sim' : 'Não'
        }));

        res.json(updatedData);
    } catch (error) {
        console.error('Error in /status route:', error);
        res.status(500).json({ error: 'Error checking IPs' });
    }
});

// Rota para atualizar o CSV
app.post('/update-data', express.json(), (req, res) => {
    const jsonData = req.body.data;

    const placeholders = jsonData.map(() => '(?, ?, ?, ?, ?)').join(',');
    const values = jsonData.flatMap(item => [item.IP, item.Nome, item.Tipo, item.Setor, item.Status]);

    db.run(`DELETE FROM devices`); // Limpa a tabela antes de inserir novos dados
    db.run(`INSERT INTO devices (IP, Nome, Tipo, Setor, Status) VALUES ${placeholders}`, values, (err) => {
        if (err) {
            console.error('Error saving to database:', err);
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
