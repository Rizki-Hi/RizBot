const { create, Client } = require('@open-wa/wa-automate')
const { color, messageLog } = require('./utils')
const msgHandler = require('./handler/message')

const start = (client = new Client()) => {
    console.log('[DEV]', color('Red Emperor', 'yellow'))
    console.log('[CLIENT] CLIENT Started!')

    // Message log for analytic
    client.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))

    // Force it to keep the current session
    client.onStateChanged((state) => {
        console.log('[Client State]', state)
        if (state === 'CONFLICT' || state === 'DISCONNECTED') client.forceRefocus()
    })

    // listening on message
    client.onMessage((message) => {
        // Cut message Cache if cache more than 3K
        client.getAmountOfLoadedMessages().then((msg) => (msg >= 3000) && client.cutMsgCache())
        // Message Handler
        msgHandler(client, message)
    })

    // listen group invitation
    client.onAddedToGroup(({ groupMetadata: { id }, contact: { name } }) =>
        client.getGroupMembersId(id)
            .then((ids) => {
                console.log('[CLIENT]', color(`*Convidado para o grupo.* [ ${name} => ${ids.length}]`, 'yellow'))
                // conditions if the group members are less than 10 then the bot will leave the group
                if (ids.length <= 10) {
                    client.sendText(id, '*Desculpe, o membro mínimo do grupo é de 10 usuários para usar este bot,Tchau...*').then(() => client.leaveGroup(id))
                } else {
                    client.sendText(id, `*Olá membros do grupo ${name}, obrigado por convidar este bot, para ver o menu do bot enviando > #menu*`)
                }
            }))

    // listen paricipant event on group (wellcome message)
    client.onGlobalParicipantsChanged(async (event) => {
        // const host = await client.getHostNumber() + '@c.us'
        // if (event.action === 'add' && event.who !== host) client.sendTextWithMentions(event.chat, `Olá, bem-vindo ao grupo @${event.who.replace('@c.us', '')} \n\nDivirta-se conosco✨`)
    })

    client.onIncomingCall((callData) => {
        // client.contactBlock(callData.peerJid)
    })
}

const options = {
    sessionId: 'Imperial',
    headless: true,
    qrTimeout: 0,
    authTimeout: 0,
    restartOnCrash: start,
    cacheEnabled: false,
    useChrome: true,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: false,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ]
}

create(options)
    .then((client) => start(client))
    .catch((err) => new Error(err))
