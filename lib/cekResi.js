const { fetchJson } = require('../utils/fetcher')

/**
 * Get Resi Information
 *
 * @param {string} ekspedisi - nama ekpedisi
 * @param {string} resi - no / kode resi
 */
module.exports = cekResi = (ekspedisi, resi) => new Promise((resolve, reject) => {
    fetchJson(`http://www2.correios.com.br/sistemas/rastreamento/resi?resi=${resi}&kurir=${ekspedisi}`)
        .then((result) => {
            if (result.status.code != 200 && result.status.description != 'OK') return resolve(result.status.description)
            // eslint-disable-next-line camelcase
            const { result: { summary, details, delivery_status, manifest } } = result
            const manifestText = manifest.map(x => `⏰ ${x.manifest_date} ${x.manifest_time}\n └ ${x.manifest_description}`)
            const resultText = `
⚙️ *Dados*

*Código de rastreamento: ${tracking_code}*
*Data/Hora: ${datahora}*
*Histórico: ${historico}*
*Normalização Data/Hora: ${normalizado_datahora}*
*Situação: ${situacao}*


            resolve(resultText)
        }).catch((err) => {
            console.error(err)
            reject(err)
        })
})
