/* eslint-disable prefer-promise-reject-errors */
const { getVideoMeta } = require('tiktok-scraper')
const { fetchJson } = require('../utils/fetcher')
const { promisify } = require('util')
const { instagram, twitter } = require('video-url-link')

const igGetInfo = promisify(instagram.getInfo)
const twtGetInfo = promisify(twitter.getInfo)

/**
 * *Obtenha a metadata do TikTok*
 *
 * @param  {String} url
 */
const tiktok = (url) => new Promise((resolve, reject) => {
    console.log('*Obtenha metadata de* =>', url)
    getVideoMeta(url, { noWaterMark: true, hdVideo: true })
        .then(async (result) => {
            console.log('Obter vídeo de', '@' + result.authorMeta.name, 'ID:', result.id)
            if (result.videoUrlNoWaterMark) {
                result.url = result.videoUrlNoWaterMark
                result.NoWaterMark = true
            } else {
                result.url = result.videoUrl
                result.NoWaterMark = false
            }
            resolve(result)
        }).catch((err) => {
            console.error(err)
            reject(err)
        })
})

/**
 * *Obtenha a metadata do Instagram*
 *
 * @param  {String} url
 */
const insta = (url) => new Promise((resolve, reject) => {
    console.log('Obtenha metadata de =>', url)
    const uri = url.replace(/\?.*$/g, '')
    igGetInfo(uri, {})
        .then((result) => resolve(result))
        .catch((err) => {
            console.error(err)
            reject(err)
        })
})

/**
 * *Obtenha a metadata do Twitter*
 *
 * @param  {String} url
 */
const tweet = (url) => new Promise((resolve, reject) => {
    console.log('*Obtenha metadata de* =>', url)
    twtGetInfo(url, {})
        .then((content) => resolve(content))
        .catch((err) => {
            console.error(err)
            reject(err)
        })
})

/**
 * *Obtenha a metadata do Facebook*
 *
 * @param  {String} url
 */
const facebook = (url) => new Promise((resolve, reject) => {
    console.log('*Obtenha metadata de* =>', url)
    const apikey = '3tgDBIOPAPl62b0zuaWNYog2wvRrc4V414AjMi5zdHbU4a'
    fetchJson('http://keepsaveit.com/api/?api_key=' + apikey + '&url=' + url, { method: 'GET' })
        .then((result) => {
            const key = result.code
            switch (key) {
            case 212:
                return reject('*Bloqueio de acesso para você. Você atingiu o limite máximo de 5 acessos por minuto, pare os acessos extras.*')
            case 101:
                return reject('*Erro de chave API: sua chave de acesso está errada*')
            case 102:
                return reject('*Sua conta não está ativada.*')
            case 103:
                return reject('*Sua conta está suspensa por alguns motivos.*')
            case 104:
                return reject('*Erro de chave API: você não definiu sua api_key nos parâmetros.*')
            case 111:
                return reject('*O acesso total não é permitido com a DEMO API key.*')
            case 112:
                return reject('*Desculpe, algo está errado ou um link inválido. Por favor, tente novamente ou verifique seu url.*')
            case 113:
                return reject('*Desculpe, este site não é compatível.*')
            case 404:
                return reject('*O link que você seguiu pode estar quebrado ou a página pode ter sido removida.*')
            case 405:
                return reject('*Você não pode baixar mídia no perfil privado. Parece que o vídeo que você deseja baixar é privado e não pode ser acessado pelo seu servidor.'*)
            default:
                return resolve(result)
            }
        }).catch((err) => {
            console.error(err)
            reject(err)
        })
})

module.exports = {
    tiktok,
    insta,
    tweet,
    facebook
}
