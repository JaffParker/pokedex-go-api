const Crawler = require('crawler')
const { join } = require('path')
const { writeFile } = require('fs/promises')

const crawler = new Crawler({ rateLimit: 1000 })

const dataDir = join(__dirname, 'data')
const pokemonFile = join(dataDir, 'pokemon.json')
const pokemon = require(pokemonFile)
const newData = {}
const fastMoves = require(join(dataDir, 'fastAttacks.json'))
const chargedMoves = require(join(dataDir, 'chargedAttacks.json'))

const queue = pokemon.map((mon, i) => ({
  uri: mon.detailsUrl,
  callback(error, res, done) {
    console.log(`Doing mon #${mon.id} ${mon.name} (${pokemon.length - i} left)`)

    const $ = res.$

    const weakRows = $('.weak tr').toArray()
    const resRows = $('.res tr').toArray()

    const fastRows = $('table.moves').first().find('tr').toArray()
    const chargedRows = $('table.moves').last().find('tr').toArray()
    fastRows.shift()
    chargedRows.shift()

    newData[mon.id] = {
      weaknesses: weakRows.map((row) => ({
        type: $(row).find('td').first().text().trim(),
        multiplier: parseInt($(row).find('span').first().text().trim()),
      })),
      strengths: resRows.map((row) => ({
        type: $(row).find('td').first().text().trim(),
        multiplier: parseInt($(row).find('span').first().text().trim()),
      })),
      fastAttacks: fastRows
        .map((row) => {
          $(row).find('td').first().find('span').remove()
          return $(row).find('td').first().text().trim()
        })
        .map((atk) => fastMoves.find((move) => move.name === atk).id),
      chargedAttacks: chargedRows
        .map((row) => {
          $(row).find('td').first().find('span').remove()
          return $(row).find('td').first().text().trim()
        })
        .map((atk) => chargedMoves.find((move) => move.name === atk).id),
    }

    done()
  },
}))

crawler.queue(queue)

crawler.on('drain', function () {
  writeFile(
    pokemonFile,
    JSON.stringify(
      pokemon.map((mon) => ({ ...mon, ...newData[mon.id] })),
      null,
      2
    ) + '\n'
  )
})
