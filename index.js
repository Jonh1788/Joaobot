const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf('7910641603:AAGpAVfxZG530poA-XZbNRP5havb78wEOic');

// ID do grupo que o bot gerencia
const groupId = -1002178917131; // Substitua pelo ID do seu grupo

// Array para armazenar os números de telefone
let numerosSalvos = [];
bot.telegram.getChat(groupId)
    .then((chat) => {
        console.log(`O grupo existe. Detalhes:`);
        console.log(`Nome: ${chat.title}`);
        console.log(`Tipo: ${chat.type}`);
    })
    .catch((error) => {
        console.error('Erro ao verificar o grupo:', error.message);
    });
// Carrega os números salvos de um arquivo, se existir
if (fs.existsSync('numerosSalvos.json')) {
    numerosSalvos = JSON.parse(fs.readFileSync('numerosSalvos.json'));
}

// Função para salvar os números em um arquivo
function salvarNumeros() {
    fs.writeFileSync('numerosSalvos.json', JSON.stringify(numerosSalvos));
}




// Handler para aprovar automaticamente os pedidos de entrada no grupo específico
bot.on('chat_join_request', async (ctx) => {
    // Verifica se a solicitação é para o grupo gerenciado
    if (ctx.chatJoinRequest.chat.id === groupId) {
        const userId = ctx.chatJoinRequest.from.id;
        const nomeUsuario = ctx.chatJoinRequest.from.first_name;

        try{
            await ctx.approveChatJoinRequest(userId);
        } catch(error){
            console.log('Erro ao aprovar solicitação de entrada:', error)
        }

        // Tenta enviar uma mensagem privada ao usuário
        try {
            await bot.telegram.sendMessage(
                userId,
                `E aiiii, ${nomeUsuario}! Eu acabei de te aceitar no meu GRUPO GRATUITO, parabéns pela decisão! 🥳

                Se liga só, eu tenho um SUPER PRESENTE que vai te deixar ainda mais perto do seu sucesso nas apostas esportivas… 🎁
                
                Para desbloquear esse presente, você deve clicar no botão abaixo…`,
                Markup.keyboard([
                    Markup.button.contactRequest('📞 Compartilhar número de telefone')
                ]).oneTime().resize()
            );

        } catch (error) {
            console.log('Não foi possível enviar mensagem privada:', error);
            // Se não for possível enviar mensagem privada, envia uma mensagem no grupo
            // await bot.telegram.sendMessage(
            //     groupId,
            //     `Olá ${nomeUsuario}, por favor, inicie uma conversa privada comigo (@${bot.options.username}) e compartilhe seu número de telefone.`
            // );
        }
    }
});

// Handler para receber o contato do usuário
bot.on('contact', async (ctx) => {
    const numeroTelefone = ctx.message.contact.phone_number;
    const userId = ctx.message.from.id;
    const nomeUsuario = ctx.from.first_name || 'usuário';

    // Verifica se o número já foi salvo
    if (!numerosSalvos.some(contato => contato.userId === userId)) {
        numerosSalvos.push({ userId, numeroTelefone });
        salvarNumeros();
        await ctx.reply('Obrigado por compartilhar seu número!');

        // Enviar a segunda mensagem após o compartilhamento do contato
        try {
            await bot.telegram.sendMessage(
                userId,
                `Parabéns, ${nomeUsuario}!🎉
                Boa, que presentaço em? você acabou de ganhar um ACESSO 100% GRATUITO ao meu GRUPO de ALAVANCAGEM! ✅
                ⚠️  Atenção! Não dou essa oportunidade para todos, então você precisa ser rápido — as vagas são limitadas!
                Me chama no whatsapp para garantir a sua vaga 👇🏻`,
                Markup.inlineKeyboard([
                    Markup.button.url('CLIQUE AQUI E GARANTA A SUA VAGA', 'https://wa.me/5551981055222')
                ])
            );
        } catch (error) {
            console.log('Não foi possível enviar a segunda mensagem:', error);
        }
    } else {
        ctx.reply('Seu número já está salvo em nosso sistema.');
    }
});


// Função para enviar mensagens de broadcast
function enviarBroadcast(mensagem) {
    numerosSalvos.forEach(contato => {
        bot.telegram.sendMessage(contato.userId, mensagem)
            .catch(err => console.log(`Erro ao enviar mensagem para ${contato.userId}:`, err));
    });
}

// Comando para iniciar o broadcast (restrito aos administradores)
bot.command('broadcast', (ctx) => {
    const userId = ctx.message.from.id;
    const mensagem = ctx.message.text.split(' ').slice(1).join(' ');

    // IDs dos administradores autorizados (substitua pelos IDs corretos)
    const admins = [123456789]; // Coloque seu ID aqui

    if (!admins.includes(userId)) {
        return ctx.reply('Você não tem permissão para usar este comando.');
    }

    if (mensagem) {
        enviarBroadcast(mensagem);
        ctx.reply('Mensagem enviada para todos os contatos salvos.');
    } else {
        ctx.reply('Por favor, forneça a mensagem após o comando /broadcast');
    }
});

bot.start((ctx) =>  {
    const nomeUsuario = ctx.from.first_name || 'usuário';
    ctx.reply(
    `Olá ${nomeUsuario}, bem-vindo ao nosso grupo! Por favor, compartilhe seu número de telefone conosco.`,
    Markup.keyboard([
        Markup.button.contactRequest('📞 Compartilhar número de telefone')
    ]).oneTime().resize()
)});


bot.launch().then(() => {
    console.log('Bot iniciado com sucesso!');
});