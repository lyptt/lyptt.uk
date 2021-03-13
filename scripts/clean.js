const fs = require('fs-extra')
const path = require('path')

const buildDir = path.resolve(path.join(__dirname, '..', 'dist'))
const webmodulesDir = path.resolve(path.join(__dirname, '..', 'web_modules'))

fs.removeSync(buildDir)
fs.removeSync(webmodulesDir)
