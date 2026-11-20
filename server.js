require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve ficheiros estáticos tanto da raiz como da pasta public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Endpoint de verificação de integridade
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        service: 'David Pereira - Consultoria & Desenvolvimento Web',
        timestamp: new Date().toISOString()
    });
});

// Endpoint de receção de contactos institucionais
app.post('/api/contact', (req, res) => {
    const { name, company, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Nome, email e mensagem são campos de preenchimento obrigatório.' });
    }
    
    console.log(`[Novo Contacto] Nome: ${name} | Empresa: ${company || 'N/A'} | Email: ${email} | Assunto: ${subject}`);
    res.json({ success: true, message: 'Solicitação de contacto registada com sucesso.' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corporativo ativo na porta ${PORT}: http://localhost:${PORT}`);
});
