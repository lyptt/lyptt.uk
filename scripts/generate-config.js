const fs = require('fs')
const path = require('path')
const prod = process.env.NODE_ENV === 'production'

const config = JSON.stringify(
  {
    debug: !prod,
  },
  null,
  2
)

const mod = `const Config = ${config}

export default Config
`

fs.writeFileSync(path.join(__dirname, '..', 'src', 'config.js'), mod, 'utf8')
