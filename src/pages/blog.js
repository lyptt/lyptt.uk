import { h } from '/web_modules/preact.js'
import hx from '../utils/hyperscript.js'
import Heading from '../components/heading.js'
import Hyperlink from '../components/hyperlink.js'
import posts from '../posts.js'

const { article } = hx(h)

const Blog = () =>
  article({ className: 'blog-page' }, [
    Heading('Dev diary'),
    ...posts.map(({ title, url }) =>
      Hyperlink({ href: `/blog/${url}`, standalone: true }, title)
    ),
  ])

export default Blog
