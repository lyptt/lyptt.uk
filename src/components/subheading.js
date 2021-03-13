import { h } from '/web_modules/preact.js'
import hx from '../utils/hyperscript.js'

const { h2 } = hx(h)

const Subheading = (title, ...props) => h2(props, title)

export default Subheading
