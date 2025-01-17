import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: 'ar.env' });
dotenv.config({ path: 'email.env' });

const { Pool } = pkg;
dotenv.config();

const app = express();
const port = 3200;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'views')));
app.use('/ts', express.static(path.join(__dirname, 'src', 'ts')));
app.use('/styles', express.static(path.join(__dirname, 'src' ,'styles')));
app.use('/images', express.static(path.join(__dirname, 'src', 'images')));

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
 
app.get('/', (req: Request, res: Response): void => {
    console.log('Requisição GET para /');
    res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

app.get('/login', (req: Request, res: Response): void => {
    console.log('Requisição GET para /login');
    res.sendFile(path.join(__dirname, 'src', 'views', 'login.html'));
});

app.get('/register', (req: Request, res: Response): void => {
    console.log('Requisição GET para /register');
    res.sendFile(path.join(__dirname, 'src', 'views', 'register.html'));
});

app.get('/mywallet', (req: Request, res: Response): void => {
    console.log('Requisição GET para /mywallet');
    res.sendFile(path.join(__dirname, 'src', 'views', 'mywallet.html'));
});

app.get('/welcome', (req: Request, res: Response): void => {
    console.log('Requisição GET para /welcome');
    res.sendFile(path.join(__dirname, 'src', 'views', 'welcome.html'));
});

app.get('/bet', (req: Request, res: Response): void => {
    console.log('Requisição GET para /bet');
    res.sendFile(path.join(__dirname, 'src', 'views', 'bet.html'));
});

app.get('/newevent', (req: Request, res: Response): void => {
    console.log('Requisição GET para /newevent');
    res.sendFile(path.join(__dirname, 'src', 'views', 'newevent.html'));
});

app.get('/closeevents', (req: Request, res: Response): void => {
    console.log('Requisição GET para /closeevents');
    res.sendFile(path.join(__dirname, 'src', 'views', 'closeevents.html'));
});

app.get('/admpage', (req: Request, res: Response): void => {
    console.log('Requisição GET para /admpage');
    res.sendFile(path.join(__dirname, 'src', 'views', 'admpage.html'));
});

app.get('/approveevents', (req: Request, res: Response): void => {
    console.log('Requisição GET para /approveevents');
    res.sendFile(path.join(__dirname, 'src', 'views', 'approveevents.html'));
});

app.get('/rejectevents', (req: Request, res: Response): void => {
    console.log('Requisição GET para /rejectevents');
    res.sendFile(path.join(__dirname, 'src', 'views', 'rejectevents.html'));
});

app.post('/login', async (req: Request, res: Response): Promise<void> => {
    console.log('Requisição POST para /login');
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) {
            console.log('Login bem-sucedido para:', email);
            res.status(200).json({ message: 'Login bem-sucedido!' });
        } else {
            console.log('Email ou senha inválidos para:', email);
            res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.post('/register', async (req: Request, res: Response): Promise<void> => {
    console.log('Requisição POST para /register');
    const { email, name, cpf, password, birthdate} = req.body;

    try {
        await pool.query(
            'INSERT INTO users (email, name, cpf, password, birthdate) VALUES ($1, $2, $3, $4, $5)',
            [email, name, cpf, password, birthdate]
        );

        await pool.query(
            'INSERT INTO wallets (email, balance) VALUES ($1, 0)', 
            [email]
        );
        console.log('Cadastro bem-sucedido para:', email);
        res.status(201).json({ message: 'Cadastro bem-sucedido!' });
    } catch (error) {
        console.error('Erro ao fazer cadastro:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.get('/users/check-admin', async (req: Request, res: Response): Promise<void> => {
    const { email } = req.query;

    try {
        const result = await pool.query(
            'SELECT adm FROM users WHERE email = $1',
            [email]
        );
        if (result.rows.length > 0) {
            const isAdmin = result.rows[0].adm;
            res.json({ isAdmin });
        } else {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    } catch (err) {
        console.error('Erro ao verificar administrador:', err);
        res.status(500).json({ error: 'Erro ao verificar administrador' });
    }
});

app.post('/wallet/get-balance', async (req: Request, res: Response): Promise<void> => {
    console.log('Requisição POST para /wallet/get-balance');
    const { email } = req.body;

    try {
        const result = await pool.query('SELECT balance FROM wallets WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const balance = result.rows[0].balance;
            console.log('Saldo recuperado para:', email, balance);
            res.status(200).json({ balance });
        } else {
            console.log('Carteira não encontrada para:', email);
            res.status(404).json({ message: 'Carteira não encontrada.' });
        }
    } catch (error) {
        console.error('Erro ao obter saldo:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.post('/wallet/add-balance', async (req: Request, res: Response): Promise<void> => {
    console.log('Requisição POST para /wallet/add-balance');
    const { email, amount } = req.body;

    try {
        await pool.query('UPDATE wallets SET balance = balance + $1 WHERE email = $2', [amount, email]);
        console.log('Saldo adicionado para:', email);
        res.status(200).json({ message: 'Saldo adicionado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar saldo:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

function calculateWithdrawalFee(amount: number): number {
    if (amount <= 100) {
        return amount * 0.04;
    } else if (amount <= 1000) {
        return amount * 0.03;
    } else if (amount <= 5000) {
        return amount * 0.02;
    } else if (amount <= 101000) {
        return amount * 0.01;
    } else {
        throw new Error("O valor excede o limite máximo de saque.");
    }
}

app.post('/wallet/remove-balance', async (req: Request, res: Response): Promise<void> => {
    console.log('Requisição POST para /wallet/remove-balance');
    const { email, amount } = req.body;
  
    try {
        const result = await pool.query('SELECT balance FROM wallets WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const currentBalance = result.rows[0].balance;
            const fee = calculateWithdrawalFee(amount);
            const totalAmount = amount - fee;
  
            if (currentBalance >= totalAmount) {
                await pool.query('UPDATE wallets SET balance = balance - $1 WHERE email = $2', [totalAmount, email]);
                console.log(`Saldo removido para: ${email}. Valor solicitado: R$${amount.toFixed(2)}, taxa: R$${fee.toFixed(2)}, total descontado: R$${totalAmount.toFixed(2)}`);
                
                res.status(200).json({
                    message: 'Saldo removido com sucesso!',
                    detalhes: {
                        valorSolicitado: amount.toFixed(2),
                        taxa: fee.toFixed(2),
                        totalDescontado: totalAmount.toFixed(2)
                    }
                }); 
            } else {
                console.log('Saldo insuficiente para:', email);
                res.status(400).json({ message: 'Saldo insuficiente.' });
            }
        } else {
            console.log('Carteira não encontrada para:', email);
            res.status(404).json({ message: 'Carteira não encontrada.' });
        }
    } catch (error) {
        console.error('Erro ao remover saldo:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});
  
app.get('/wallet/extract/:email', async (req: Request, res: Response): Promise<void> => {
    const { email } = req.params;
  
    try {
      const result = await pool.query(
        `SELECT id_evento AS evento, lado_apostado, valor_apostado AS valor, TO_CHAR(data_aposta, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') 
        AS data_evento FROM apostas WHERE email_usuario = $1 `,
        [email]
      );
  
    if (result.rows.length === 0) {
        res.status(404).json({ message: 'Nenhum registro encontrado para este e-mail.' });
        return; 
      }
  
      res.json(result.rows);
    } catch (err) {
      console.error('Erro ao buscar os dados do banco:', err);
      res.status(500).json({ error: 'Erro ao buscar os dados do banco' });
    }
});

app.post('/eventos/create', async (req: Request, res: Response): Promise<void> => {
    const { nome_evento, lado_a, lado_b, data_evento, data_final_evento, porcentagem_lado_a, porcentagem_lado_b, descricao_event, emailCreator } = req.body;
    
    if (new Date(data_final_evento) <= new Date(data_evento)) {
         res.status(400).json({ message: 'A data final do evento não pode ser anterior ou igual à data do evento.' });
    }

    if (new Date(data_evento) <= new Date()) {
         res.status(400).json({ message: 'O evento não pode ser criado com uma data no passado.' });
    }

    console.log('Dados recebidos:', req.body);

    try {
        const result = await pool.query(
            `INSERT INTO eventos (nome_evento, lado_a, lado_b, data_evento, data_final_evento, porcentagem_lado_a, porcentagem_lado_b, descricao, status, email_creator)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendente', $9) RETURNING *`,
            [nome_evento, lado_a, lado_b, data_evento, data_final_evento, porcentagem_lado_a, porcentagem_lado_b, descricao_event, emailCreator]
        );
        
        res.status(201).json({
            message: 'Evento criado com sucesso!',
            evento: result.rows[0]
        });
    } catch (err) {
        console.error('Erro ao criar evento:', err);
        res.status(500).json({ error: 'Erro ao criar o evento' });
    }
});


app.get('/events/pending', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM eventos WHERE aprovado = FALSE AND status != $1', ['rejeitado']);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar eventos pendentes:', err);
        res.status(500).json({ error: 'Erro ao buscar eventos pendentes' });
    }
});

app.post('/events/approve/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await pool.query('UPDATE eventos SET aprovado = TRUE WHERE id = $1', [id]);
        res.status(200).json({ message: 'Evento aprovado com sucesso!' });
    } catch (err) {
        console.error('Erro ao aprovar evento:', err);
        res.status(500).json({ error: 'Erro ao aprovar evento' });
    }
});

app.post('/events/reject/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { motivo }: { motivo: string } = req.body;

    if (!motivo) {
        res.status(400).json({ error: 'Motivo da rejeição é obrigatório.' });
        return;
    }

    try {
        const result = await pool.query('SELECT email_creator FROM eventos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Evento não encontrado.' });
            return;
        }
        const emailCreator = result.rows[0].email_creator;

        await pool.query(
            'UPDATE eventos SET aprovado = FALSE, status = $2 WHERE id = $1',
            [id, 'rejeitado']
        );
        console.log(`Evento ${id} rejeitado no banco de dados com o motivo: ${motivo}`);

        if (emailCreator) {
            const info = await transporter.sendMail({
                from: '"Eliza Bet" <boteventoelizabet@gmail.com>',
                to: emailCreator,
                subject: 'Seu Evento Foi Recusado',
                text: `Seu evento foi recusado pelo seguinte motivo: ${motivo}`,
            });

            console.log(`Email enviado com sucesso para ${emailCreator}. Info: ${info.messageId}`);
        } else {
            console.error('O evento não possui um e-mail de criador associado.');
        }

        res.status(200).json({ message: `Evento rejeitado com sucesso! Motivo: ${motivo}` });
    } catch (err) {
        console.error('Erro ao rejeitar evento ou enviar e-mail:', err);
        res.status(500).json({ error: 'Erro ao rejeitar o evento ou enviar o e-mail.' });
    }
});

app.get('/events/available', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM eventos WHERE status = $1 AND aprovado = $2', ['pendente', true]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar eventos:', err);
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});
app.get('/events/search', async (req: Request, res: Response): Promise<void> => {
    const keyword = req.query.keyword as string;
    console.log('Keyword recebida no backend:', keyword);

    if (!keyword) {
         res.status(400).json({ error: 'Palavra-chave não informada.' });
    }
    try {
        const result = await pool.query('SELECT id, nome_evento, lado_a, data_evento FROM eventos WHERE nome_evento ILIKE $1 AND status = $2 AND aprovado = $3', [`%${keyword}%`, 'pendente', true] )
        res.json(result.rows);
        console.log('Resultado da consulta:', result.rows);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Nenhum evento encontrado.' });
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

app.get('/events/proximoAcabar', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM eventos WHERE status = $1 AND aprovado = $2 ORDER BY data_final_evento ASC;', ['pendente', true]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar eventos:', err);
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});

app.get('/events/maisApostados', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT e.id AS id_evento, e.nome_evento, e.lado_a, e.lado_b, e.data_evento, e.status, e.aprovado, COUNT(a.id) AS total_apostas, SUM(a.valor_apostado) AS total_valor_apostado FROM eventos e LEFT JOIN apostas a ON e.id = a.id_evento WHERE e.status = $1 AND e.aprovado = $2 GROUP BY e.id, e.nome_evento, e.lado_a, e.lado_b, e.data_evento, e.status, e.aprovado ORDER BY total_apostas DESC LIMIT 10;', ['pendente', true]);
        res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar os eventos mais apostados:', error);
      res.status(500).json({ error: 'Erro ao buscar os eventos mais apostados' });
    }
  });

app.post('/bets/create', async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, side, amount, email }: { eventId: number; side: string; amount: number; email: string } = req.body;
        const walletResponse = await pool.query('SELECT balance FROM wallets WHERE email = $1', [email]);
        const balance: number = walletResponse.rows[0].balance;

        if (balance < amount) {
            res.status(400).json({ error: 'Saldo insuficiente.' });
            return;
        }

        await pool.query('INSERT INTO apostas (id_evento, email_usuario, lado_apostado, valor_apostado) VALUES ($1, $2, $3, $4)', [eventId, email, side, amount]);
        const newBalance: number = balance - amount;
        await pool.query('UPDATE wallets SET balance = $1 WHERE email = $2', [newBalance, email]);
        res.status(200).json({ message: 'Aposta realizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao realizar a aposta:', error);
        res.status(500).json({ error: 'Erro ao processar a aposta.' });
    }
});

app.get('/events/search/:name', async (req: Request, res: Response): Promise<void> => {
    const { name } = req.params; // Obtém o nome do evento da URL

    try {
        const query = `
            SELECT * FROM eventos
            WHERE nome_evento ILIKE $1 AND status = $2 AND aprovado = $3
        `;
        const values = [`%${name}%`, 'pendente', true]; // Busca eventos que contenham o nome fornecido

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Nenhum evento encontrado' });
        } else {
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Erro ao buscar evento por nome:', err);
        res.status(500).json({ error: 'Erro ao buscar evento por nome' });
    }
});
app.get('/events/search', async (req: Request, res: Response): Promise<void> => {
    const keyword = req.query.keyword as string;
    console.log('Keyword recebida no backend:', keyword);

    if (!keyword) {
         res.status(400).json({ error: 'Palavra-chave não informada.' });
    }
    try {
        const query = `
            SELECT id, nome_evento, lado_a, lado_b, data_evento 
            FROM eventos 
            WHERE nome_evento ILIKE $1`;
        
        const values = [`%${keyword}%`];
        const result = await pool.query(query, values);
        console.log('Resultado da consulta:', result.rows);

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Nenhum evento encontrado.' });
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});


app.get('/events/details/:nomeEvento', async (req: Request, res: Response): Promise<void> => {
    const { nomeEvento } = req.params;

    try {
        const eventResult = await pool.query('SELECT * FROM eventos WHERE nome_evento = $1', [nomeEvento]);

        if (eventResult.rows.length === 0) {
            res.status(404).json({ message: 'Evento não encontrado.' });
            return;
        }
        const event = eventResult.rows[0];
        res.status(200).json({ lado_a: event.lado_a, lado_b: event.lado_b });
    } catch (error) {
        console.error('Erro ao buscar detalhes do evento:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do evento.' });
    }
});

app.post('/events/close/:nomeEvento', async (req: Request, res: Response): Promise<void> => {
    const { nomeEvento } = req.params;
    const { winningSide }: { winningSide: string } = req.body;

    try {
        const eventResult = await pool.query('SELECT * FROM eventos WHERE nome_evento = $1', [nomeEvento]);

        if (eventResult.rows.length === 0) {
            res.status(404).json({ message: 'Evento não encontrado.' });
            return;
        }

        const event = eventResult.rows[0];
        const betsResult = await pool.query('SELECT * FROM apostas WHERE id_evento = $1', [event.id]);
        const bets = betsResult.rows;
        const totalBet = bets.reduce((sum, bet) => sum + parseFloat(bet.valor_apostado), 0);

        const totalBetWinningSide = bets
            .filter(bet => bet.lado_apostado === winningSide)
            .reduce((sum, bet) => sum + parseFloat(bet.valor_apostado), 0);
        const totalWinners = bets.filter(bet => bet.lado_apostado === winningSide).length;

        if (totalWinners > 0) {
            for (const bet of bets) {
                if (bet.lado_apostado === winningSide) {
                    let betPercentage = bet.valor_apostado / totalBetWinningSide;
                    const betPercentageEvent = parseFloat(event[`porcentagem_lado_${winningSide.toLowerCase()}`]);
                    const betValue = parseFloat(bet.valor_apostado);

                    if (betPercentage > betPercentageEvent) {
                        betPercentage = betPercentageEvent;
                    }

                    const payout = (betPercentage * betValue);
                    console.log('bet.valor_apostado:', betValue);
                    console.log('betPercentage:', betPercentage);
                    console.log('totalBet:', totalBet);
                    console.log('Valor a ser pago:', payout);
                    await pool.query('UPDATE wallets SET balance = balance + $1 WHERE email = $2', [payout, bet.email_usuario]);
                }
            }
        }
        await pool.query('UPDATE eventos SET status = $1 WHERE nome_evento = $2', ['encerrado', nomeEvento]);
        res.status(200).json({ message: 'Evento encerrado e prêmios distribuídos com sucesso!' });
    } catch (error) {
        console.error('Erro ao encerrar evento:', error);
        res.status(500).json({ error: 'Erro ao encerrar evento.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor ouvindo na porta ${port}`);
});