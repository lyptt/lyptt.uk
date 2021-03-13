import { h } from '/web_modules/preact.js'
import hx from '../utils/hyperscript.js'
import Heading from '../components/heading.js'
import Subheading from '../components/subheading.js'
import Hyperlink from '../components/hyperlink.js'

const { article, p, div } = hx(h)

const Home = () =>
  article({ className: 'home-page' }, [
    Heading('Rhys Cox'),
    Subheading('polyglot developer, devops enthusiast, amateur guitarist'),
    Hyperlink(
      {
        href: 'https://www.github.com/lyptt',
        opensExternally: true,
        standalone: true,
      },
      'Open source contributions'
    ),
    Hyperlink(
      {
        href: '/blog',
        standalone: true,
      },
      'Dev diary'
    ),
    Hyperlink(
      {
        href: 'https://www.linkedin.com/in/rhys-c-468099b1',
        opensExternally: true,
        standalone: true,
      },
      'Professional history'
    ),
  ])

export default Home
