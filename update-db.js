const Crawler = require('crawler')
const { join } = require('path')
const { writeFile } = require('fs/promises')

const crawler = new Crawler({ rateLimit: 1000 })

const dataDirectory = join(__dirname, 'data')
const fastAttacksFile = join(dataDirectory, 'fastAttacks.json')
const chargedAttacksFile = join(dataDirectory, 'chargedAttacks.json')
const pokemonFile = join(dataDirectory, 'pokemon.json')

const fastAttacks = []
const chargedAttacks = []
const pokemon = []

const typesMap = {
  '1': 'Normal',
  '2': 'Fighting',
  '3': 'Flying',
  '4': 'Poison',
  '5': 'Ground',
  '6': 'Rock',
  '7': 'Bug',
  '8': 'Ghost',
  '9': 'Steel',
  '10': 'Fire',
  '11': 'Water',
  '12': 'Grass',
  '13': 'Electric',
  '14': 'Psychic',
  '15': 'Ice',
  '16': 'Dragon',
  '17': 'Dark',
  '18': 'Fairy',
}

crawler.queue([
  {
    uri: 'https://pokemon.gameinfo.io/en/moves',
    callback(error, res, done) {
      const $ = res.$

      const fastTableRows = $('article:first-of-type table tr').toArray()
      const chargedTableRows = $('article:last-of-type table tr').toArray()

      fastTableRows.shift()
      chargedTableRows.shift()

      for (const row of fastTableRows) {
        fastAttacks.push({
          id: fastAttacks.length + 1,
          type: $(row).data('type'),
          name: $(row).find('td:nth-child(2)').text().trim(),
          damage: parseInt($(row).find('td:nth-child(3)').text().trim()),
          dps: parseFloat($(row).find('td:nth-child(4)').text().trim()),
        })
      }
      for (const row of chargedTableRows) {
        chargedAttacks.push({
          id: chargedAttacks.length + 1,
          type: $(row).data('type'),
          name: $(row).find('td:nth-child(2)').text().trim(),
          damage: parseInt($(row).find('td:nth-child(3)').text().trim()),
          dps: parseFloat($(row).find('td:nth-child(4)').text().trim()),
        })
      }

      done()
    },
  },
  {
    uri: 'https://pokemon.gameinfo.io/en/js/pokemon-home.js?v=b15c1b-1.3',
    jquery: false,
    callback(error, res, done) {
      eval(res.body)
      const pokemonEntries = pokemon_list.flat(2).map(Object.entries).flat()

      for (const [id, [, name, , , , types]] of pokemonEntries) {
        pokemon.push({
          id,
          name,
          types: types.map((type) => typesMap[type]),
          detailsUrl: `https://pokemon.gameinfo.io/en/pokemon/${id}-${name
            .toLowerCase()
            .replace(/\W/g, '')}`,
        })
      }

      done()
    },
  },
])

crawler.on('drain', function () {
  writeFile(fastAttacksFile, JSON.stringify(fastAttacks, null, 2) + '\n')
  writeFile(chargedAttacksFile, JSON.stringify(chargedAttacks, null, 2) + '\n')
  writeFile(pokemonFile, JSON.stringify(pokemon, null, 2) + '\n')
})
