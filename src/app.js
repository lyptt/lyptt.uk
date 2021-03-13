import './lib/prism.js'
import { h, render } from '/web_modules/preact.js'
import { router } from './router.js'
import { history } from './history.js'
import LoadingPage from './pages/loading.js'

const $app = document.getElementById('app')

async function renderApp(location, ...props) {
  render(h(LoadingPage), $app)
  const route = await router.resolve(location.pathname)
  const Component = await route()
  render(h(Component), $app)
}

history.listen(renderApp)
renderApp(history.location)
