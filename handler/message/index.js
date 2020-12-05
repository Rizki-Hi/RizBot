require('dotenv').config()
const { decryptMedia, Client } = require('@open-wa/wa-automate')
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')
const { downloader, cekResi, removebg, urlShortener, meme, translate, getLocationData } = require('../../lib')
const { msgFilter, color, processTime, is } = require('../../utils')
const mentionList = require('../../utils/mention')
const { uploadImages } = require('../../utils/fetcher')

const { menuId, menuEn } = require('./text') // Indonesian & English menu

module.exports = msgHandler = async (client, message) => {
    try {
        const { type, id, from, t, sender, isGroupMsg, chat, caption, isMedia, isGif, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        const { name, formattedTitle } = chat
        let { pushname, verifiedName, formattedName } = sender
        pushname = pushname || verifiedName || formattedName // verifiedName is the name of someone who uses a business account
        const botNumber = await client.getHostNumber() + '@c.us'
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
        const groupMembers = isGroupMsg ? await client.getGroupMembersId(groupId) : ''
        const isGroupAdmins = groupAdmins.includes(sender.id) || false
        const isBotGroupAdmins = groupAdmins.includes(botNumber) || false

        // Bot Prefix
        const prefix = '#'
        body = (type === 'chat' && body.startsWith(prefix)) ? body : (((type === 'image' || type === 'video') && caption) && caption.startsWith(prefix)) ? caption : ''
        const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
        const arg = body.substring(body.indexOf(' ') + 1)
        const args = body.trim().split(/ +/).slice(1)
        const isCmd = body.startsWith(prefix)
        const isQuotedImage = quotedMsg && quotedMsg.type === 'image'
        const url = args.length !== 0 ? args[0] : ''
        const uaOverride = process.env.UserAgent

        // [BETA] Avoid Spam Message
        if (isCmd && msgFilter.isFiltered(from) && !isGroupMsg) { return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
        if (isCmd && msgFilter.isFiltered(from) && isGroupMsg) { return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }
        //
        if (!isCmd && !isGroupMsg) { return console.log('[RECV]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Message from', color(pushname)) }
        if (!isCmd && isGroupMsg) { return console.log('[RECV]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Message from', color(pushname), 'in', color(name || formattedTitle)) }
        if (isCmd && !isGroupMsg) { console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
        if (isCmd && isGroupMsg) { console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }
        // [BETA] Avoid Spam Message
        msgFilter.addFilter(from)

        switch (command) {
        // Menu and TnC
        case 'speed':
        case 'ping':
            await client.sendText(from, `*Pong 🏓!*\nSpeed: ${processTime(t, moment())} _Second_`)
            break
        case 'tnc':
            await client.sendText(from, menuId.textTnC())
            break
        case 'menu':
        case 'help':
            await client.sendText(from, menuId.textMenu(pushname))
                .then(() => ((isGroupMsg) && (isGroupAdmins)) ? client.sendText(from, '*Menu de administração do grupo: #menuadmin*') : null)
            break
        case 'menuadmin':
            if (!isGroupMsg) return client.reply(from, '*Desculpe, este comando só pode ser usado dentro de grupos! [Grupo apenas]*', id)
            if (!isGroupAdmins) return client.reply(from, '*Falha, este comando só pode ser usado por administradores de grupo! [Grupo de administração apenas]*', id)
            await client.sendText(from, menuId.textAdmin())
            break
        case 'donate':
        case 'donasi':
            await client.sendText(from, menuId.textDonasi())
            break
        // Sticker Creator
        case 'sticker':
        case 'stiker': {
            if ((isMedia || isQuotedImage) && args.length === 0) {
                const encryptMedia = isQuotedImage ? quotedMsg : message
                const _mimetype = isQuotedImage ? quotedMsg.mimetype : mimetype
                const mediaData = await decryptMedia(encryptMedia, uaOverride)
                const imageBase64 = `data:${_mimetype};base64,${mediaData.toString('base64')}`
                client.sendImageAsSticker(from, imageBase64).then(() => {
                    client.reply(from, '*Aqui está sua figurinha!*')
                    console.log(`Figurinha processado para ${processTime(t, moment())} Second`)
                })
            } else if (args[0] === 'nobg') {
                /**
                * This is Premium feature.
                * Check premium feature at https://trakteer.id/red-emperor/showcase or chat Author for Information.
                */
                client.reply(from, '*ehhh, o que é isso ???*', id)
            } else if (args.length === 1) {
                if (!is.Url(url)) { await client.reply(from, '*Desculpe, o link que você enviou é inválido. [Link inválido]*', id) }
                client.sendStickerfromUrl(from, url).then((r) => (!r && r !== undefined)
                    ? client.sendText(from, '*Desculpe, o link que você enviou não contém uma imagem. [Sem imagem]*')
                    : client.reply(from, '*Aqui está sua figurinha*')).then(() => console.log(`Sticker Processed for ${processTime(t, moment())} Second`))
            } else {
                await client.reply(from, '*Sem imagem! Para abrir uma lista de comandos de envie #menu [Formato errado]*', id)
            }
            break
        }
        case 'stikergif':
        case 'stickergif':
        case 'gifstiker':
        case 'gifsticker': {
            if (args.length !== 1) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            if (is.Giphy(url)) {
                const getGiphyCode = url.match(new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, 'gi'))
                if (!getGiphyCode) { return client.reply(from, '*Falha ao recuperar o código giphy'*, id) }
                const giphyCode = getGiphyCode[0].replace(/[-\/]/gi, '')
                const smallGifUrl = 'https://media.giphy.com/media/' + giphyCode + '/giphy-downsized.gif'
                client.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                    client.reply(from, '*Aqui está sua figurinha!*')
                    console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                }).catch((err) => console.log(err))
            } else if (is.MediaGiphy(url)) {
                const gifUrl = url.match(new RegExp(/(giphy|source).(gif|mp4)/, 'gi'))
                if (!gifUrl) { return client.reply(from, '*Falha ao recuperar o código giphy*', id) }
                const smallGifUrl = url.replace(gifUrl[0], 'giphy-downsized.gif')
                client.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                    client.reply(from, '*Aqui está sua figurinha!*')
                    console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                }).catch((err) => console.log(err))
            } else {
                await client.reply(from, '*Desculpe, por enquanto os adesivos gif só podem usar o link do giphy. [Giphy Only]*', id)
            }
            break
        }
        // Video Downloader
        case 'tiktok':
            if (args.length !== 1) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            if (!is.Url(url) && !url.includes('tiktok.com')) return client.reply(from, '*Desculpe, o link que você enviou é inválido. [Link inválido]*', id)
            await client.reply(from, `_Raspando metadatas..._ \n\n${menuId.textDonasi()}`, id)
            downloader.tiktok(url).then(async (videoMeta) => {
                const filename = videoMeta.authorMeta.name + '.mp4'
                const caps = `*Metadata:*\nNome do usuário: ${videoMeta.authorMeta.name} \nMúsica: ${videoMeta.musicMeta.musicName} \nVisualizações: ${videoMeta.playCount.toLocaleString()} \nGosteis(Likes): ${videoMeta.diggCount.toLocaleString()} \nComentários: ${videoMeta.commentCount.toLocaleString()} \nCompartilhamentos: ${videoMeta.shareCount.toLocaleString()} \nVídeo: ${videoMeta.text.trim() ? videoMeta.text : '-'}`
                await client.sendFileFromUrl(from, videoMeta.url, filename, videoMeta.NoWaterMark ? caps : `⚠ *Vídeos sem marca d'água não estão disponíveis.* \n\n${caps}`, '', { headers: { 'User-Agent': 'okhttp/4.5.0', referer: 'https://www.tiktok.com/' } }, true)
                    .then((serialized) => console.log(`*Envio de arquivo com id: ${serialized} processado durante ${processTime(t, moment())}*`))
                    .catch((err) => console.error(err))
            }).catch(() => client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id))
            break
        case 'ig':
        case 'instagram':
            if (args.length !== 1) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            if (!is.Url(url) && !url.includes('instagram.com')) return client.reply(from, '*Desculpe, o link que você enviou é inválido. [Link inválido]*', id)
            await client.reply(from, `__*Raspando metadatas...*_ \n\n${menuId.textDonasi()}`, id)
            downloader.insta(url).then(async (data) => {
                if (data.type == 'GraphSidecar') {
                    if (data.image.length != 0) {
                        data.image.map((x) => client.sendFileFromUrl(from, x, 'photo.jpg', '', null, null, true))
                            .then((serialized) => console.log(`*Envio de arquivos com ID com sucesso: ${serialized} processado durante ${processTime(t, moment())}*`))
                            .catch((err) => console.error(err))
                    }
                    if (data.video.length != 0) {
                        data.video.map((x) => client.sendFileFromUrl(from, x.videoUrl, 'video.jpg', '', null, null, true))
                            .then((serialized) => console.log(`*Envio de arquivos com ID com sucesso:* ${serialized} *processado durante* ${processTime(t, moment())}`))
                            .catch((err) => console.error(err))
                    }
                } else if (data.type == 'GraphImage') {
                    client.sendFileFromUrl(from, data.image, 'photo.jpg', '', null, null, true)
                        .then((serialized) => console.log(`*Envio de arquivos com ID com sucesso:* ${serialized} *processado durante* ${processTime(t, moment())}`))
                        .catch((err) => console.error(err))
                } else if (data.type == 'GraphVideo') {
                    client.sendFileFromUrl(from, data.video.videoUrl, 'video.mp4', '', null, null, true)
                        .then((serialized) => console.log(`*Envio de arquivos com ID com sucesso:* ${serialized} *processado durante* ${processTime(t, moment())}`))
                        .catch((err) => console.error(err))
                }
            })
                .catch((err) => {
                    console.log(err)
                    if (err === 'Not a video') { return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id) }
                    client.reply(from, '*Erro, usuário ou conta privada [Link privado ou inválido]*', id)
                })
            break
        case 'twt':
        case 'twitter':
            if (args.length !== 1) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            if (!is.Url(url) & !url.includes('twitter.com') || url.includes('t.co')) return client.reply(from, '*Desculpe, o link que você enviou é inválido. [Link inválido]*', id)
            await client.reply(from, `_*Raspando metadatas...*_ \n\n${menuId.textDonasi()}`, id)
            downloader.tweet(url).then(async (data) => {
                if (data.type === 'video') {
                    const content = data.variants.filter(x => x.content_type !== 'application/x-mpegURL').sort((a, b) => b.bitrate - a.bitrate)
                    const result = await urlShortener(content[0].url)
                    console.log('Shortlink: ' + result)
                    await client.sendFileFromUrl(from, content[0].url, 'video.mp4', `Download Do Vídeo Do Link/URL: ${result} \n\nProcessado para ${processTime(t, moment())} _Second_`, null, null, true)
                        .then((serialized) => console.log(`*Envio de arquivos com ID com sucesso:* ${serialized} *processado durante* ${processTime(t, moment())}`))
                        .catch((err) => console.error(err))
                } else if (data.type === 'photo') {
                    for (let i = 0; i < data.variants.length; i++) {
                        await client.sendFileFromUrl(from, data.variants[i], data.variants[i].split('/media/')[1], '', null, null, true)
                            .then((serialized) => console.log(`*Envio de arquivos com ID com sucesso:* ${serialized} *processado durante* ${processTime(t, moment())}`))
                            .catch((err) => console.error(err))
                    }
                }
            })
                .catch(() => client.sendText(from, '*Desculpe, o link é inválido ou não há mídia no link que você enviou. [Link inválido]'*))
            break
        case 'fb':
        case 'facebook':
            if (args.length !== 1) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            if (!is.Url(url) && !url.includes('facebook.com')) return client.reply(from, '*Desculpe, o url que você enviou é inválido. [Link inválido]*', id)
            await client.reply(from, '_*Raspando metadatas...*_ \n\nObrigado por usar este bot 💙', id)
            downloader.facebook(url).then(async (videoMeta) => {
                const title = videoMeta.response.title
                const thumbnail = videoMeta.response.thumbnail
                const links = videoMeta.response.links
                const shorts = []
                for (let i = 0; i < links.length; i++) {
                    const shortener = await urlShortener(links[i].url)
                    console.log('Shortlink: ' + shortener)
                    links[i].short = shortener
                    shorts.push(links[i])
                }
                const link = shorts.map((x) => `${x.resolution} Quality: ${x.short}`)
                const caption = `*Texto: ${title} \n\n*Vídeo Do Link/URL:* \n${link.join('\n')} \n\n*Processado em* ${processTime(t, moment())} _Second_`
                await client.sendFileFromUrl(from, thumbnail, 'videos.jpg', caption, null, null, true)
                    .then((serialized) => console.log(`*Envio de arquivos com ID com sucesso:* ${serialized} *processado durante* ${processTime(t, moment())}`))
                    .catch((err) => console.error(err))
            })
                .catch((err) => client.reply(from, `*Erro, o url é inválido ou o vídeo não carrega. [Link inválido ou sem vídeo]* \n\n${err}`, id))
            break
        // Other Command
        case 'meme':
            if ((isMedia || isQuotedImage) && args.length >= 2) {
                const top = arg.split('|')[0]
                const bottom = arg.split('|')[1]
                const encryptMedia = isQuotedImage ? quotedMsg : message
                const mediaData = await decryptMedia(encryptMedia, uaOverride)
                const getUrl = await uploadImages(mediaData, false)
                const ImageBase64 = await meme.custom(getUrl, top, bottom)
                client.sendFile(from, ImageBase64, 'image.png', '', null, true)
                    .then((serialized) => console.log(`*Envio de arquivos com ID com sucesso:* ${serialized} *processado durante* ${processTime(t, moment())}`))
                    .catch((err) => console.error(err))
            } else {
                await client.reply(from, '*Sem imagens! Para desbloquear como usar use #menu [Formato errado]*', id)
            }
            break
        case 'resi':
            if (args.length !== 2) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            const kurirs = ['correios']
            if (!kurirs.includes(args[0])) return client.sendText(from, `*O tipo de expedição de frete não é compatível. Este serviço só oferece suporte para expedição de frete* ${kurirs.join(', ')} *Por favor cheque novamente.*`)
            console.log('*Verifique o no recibo*', args[1], '*por expedição*', args[0])
            cekResi(args[0], args[1]).then((result) => client.sendText(from, result))
            break
        case 'translate':
            if (args.length != 1) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            if (!quotedMsg) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            const quoteText = quotedMsg.type == 'chat' ? quotedMsg.body : quotedMsg.type == 'image' ? quotedMsg.caption : ''
            translate(quoteText, args[0])
                .then((result) => client.sendText(from, result))
                .catch(() => client.sendText(from, '*[Erro] Código de idioma incorreto ou problema de servidor.*'))
            break
        case 'ceklok':
        case 'ceklokasi':
            if (!quotedMsg || quotedMsg.type !== 'location') return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            console.log(`*Solicitação de status da zona de expansão Covid-19* (${quotedMsg.lat}, ${quotedMsg.lng}).`)
            const zoneStatus = await getLocationData(quotedMsg.lat, quotedMsg.lng)
            if (zoneStatus.kode !== 200) client.sendText(from, '*Desculpe, ocorreu um erro ao verificar o local que você enviou.*')
            let data = ''
            for (let i = 0; i < zoneStatus.data.length; i++) {
                const { zone, region } = zoneStatus.data[i]
                const _zone = zone == 'green' ? 'Verde** (Seguro) \n' : zone == 'yellow' ? 'Amarelo* (Alerta) \n' : 'Vermelho* (Perigo) \n'
                data += `${i + 1}. Kel. *${region}* Berstatus *Zona ${_zone}`
            }
            const text = `*VERIFIQUE A LOCALIZAÇÃO DO SPREAD DE COVID-19* \n *Os resultados da inspeção do local que você enviou são* *${zoneStatus.status}* ${zoneStatus.optional}\n\n*Informações de localização afetadas perto de você*:\n${data}`
            client.sendText(from, text)
            break
        // Group Commands (group admin only)
        case 'kick':
            if (!isGroupMsg) return client.reply(from, '*Desculpe, este comando só pode ser usado dentro de grupos! [Grupo apenas]*', id)
            if (!isGroupAdmins) return client.reply(from, '*Falha, este comando só pode ser usado por administradores de grupo! [Grupo de administração apenas]*', id)
            if (!isBotGroupAdmins) return client.reply(from, '*Falha, adicione o bot como administrador do grupo! [Bot não é administrador]*', id)
            if (mentionedJidList.length === 0) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            if (mentionedJidList[0] === botNumber) return await client.reply(from, 'Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            await client.sendTextWithMentions(from, `*Pedido recebido, emitido:*\n${mentionedJidList.map(x => `@${x.replace('@c.us', '')}`).join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                if (groupAdmins.includes(mentionedJidList[i])) return await client.sendText(from, 'Falha, você não pode remover o administrador do grupo.')
                await client.removeParticipant(groupId, mentionedJidList[i])
            }
            break
        case 'promote':
            if (!isGroupMsg) return await client.reply(from, '*Desculpe, este comando só pode ser usado dentro de grupos! [Grupo apenas]*', id)
            if (!isGroupAdmins) return await client.reply(from, '*Falha, este comando só pode ser usado por administradores de grupo! [Grupo de administração apenas]*', id)
            if (!isBotGroupAdmins) return await client.reply(from, 'Falha, adicione o bot como administrador do grupo! [Bot não é administrador]*', id)
            if (mentionedJidList.length != 1) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato errado, apenas 1 usuário]*', id)
            if (groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, '*Desculpe, o usuário já é um administrador. [Bot é Admin]*', id)
            if (mentionedJidList[0] === botNumber) return await client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            await client.promoteParticipant(groupId, mentionedJidList[0])
            await client.sendTextWithMentions(from, `Pedido aceito, adicionado @${mentionedJidList[0].replace('@c.us', '')} sebagai admin.`)
            break
        case 'demote':
            if (!isGroupMsg) return client.reply(from, '*Desculpe, este comando só pode ser usado dentro de grupos! [Grupo apenas]*', id)
            if (!isGroupAdmins) return client.reply(from, '*Falha, este comando só pode ser usado por administradores de grupo! [Grupo de administração apenas]*', id)
            if (!isBotGroupAdmins) return client.reply(from, '*Falha, adicione o bot como administrador do grupo! [Bot não é administrador]*', id)
            if (mentionedJidList.length !== 1) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato errado, apenas 1 usuário]*', id)
            if (!groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, '*Desculpe, o usuário não é um administrador. [usuário não administrador]*', id)
            if (mentionedJidList[0] === botNumber) return await client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            await client.demoteParticipant(groupId, mentionedJidList[0])
            await client.sendTextWithMentions(from, `Pedido aceito, deletar departamento @${mentionedJidList[0].replace('@c.us', '')}.`)
            break
        case 'bye':
            if (!isGroupMsg) return client.reply(from, '*Desculpe, este comando só pode ser usado dentro de grupos! [Grupo apenas]*', id)
            if (!isGroupAdmins) return client.reply(from, '*Falha, este comando só pode ser usado por administradores de grupo! [Grupo de administração apenas]*', id)
            client.sendText(from, '*Adeus...* ( ⇀‸↼‶ )').then(() => client.leaveGroup(groupId))
            break
        case 'del':
            if (!isGroupAdmins) return client.reply(from, '*Falha, este comando só pode ser usado por administradores de grupo! [Grupo de administração apenas]*', id)
            if (!quotedMsg) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            if (!quotedMsgObj.fromMe) return client.reply(from, '*Desculpe, o formato da mensagem está errado, por favor verifique o menu. [Formato incorreto]*', id)
            client.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false)
            break
        case 'tagall':
        case 'everyone':
            /**
            * This is Premium feature.
            * Check premium feature at https://trakteer.id/red-emperor/showcase or chat Author for Information.
            */
            client.reply(from, 'ehhh, o que é isso ??? \ n Verifique o recurso premium em https://trakteer.id/red-emperor/showcase ou chat Autor para obter informações', id)
            break
        case 'botstat': {
            const loadedMsg = await client.getAmountOfLoadedMessages()
            const chatIds = await client.getAllChatIds()
            const groups = await client.getAllGroups()
            client.sendText(from, `Status :\n- *${loadedMsg}* Mensagens carregadas\n- *${groups.length}* Bate-papos em grupo\n- *${chatIds.length - groups.length}* Bate-papos pessoais\n- *${chatIds.length}* Bate-papos Totais`)
            break
        }
        default:
            console.log(color('[ERROR]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Comando não registrado de', color(pushname))
            break
        }
    } catch (err) {
        console.error(color(err, 'red'))
    }
}

