import { h } from '/web_modules/preact.js'
import hx from '../utils/hyperscript.js'

const { article } = hx(h)

const Loading = () => article({ className: 'loading-page' })

export default Loading
