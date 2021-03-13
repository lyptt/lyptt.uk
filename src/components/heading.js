import { h } from '/web_modules/preact.js'
import hx from '../utils/hyperscript.js'

const { h1 } = hx(h)

const Heading = (title, ...props) => h1(props, title)

export default Heading
