import UniversalRouter from '/web_modules/universal-router.js'
import { h } from '/web_modules/preact.js'

let HomeComponent, BlogComponent, BlogPostComponent

const Home = async () => HomeComponent = HomeComponent || await import('./pages/home.js')
const Blog = async () => BlogComponent = BlogComponent || await import('./pages/blog.js')
const BlogPost = async () => BlogPostComponent = BlogPostComponent || await import('./pages/blog-post.js')

const routes = [
  {
    path: '',
    action: async () => {
      const ret = (await Home()).default
      return () => ret
    },
  },
  {
    path: '/blog',
    action: async () => {
      const ret = (await Blog()).default
      return () => ret
    },
  },
  {
    path: '/blog/:permalink',
    action: async ({ params }) => {
      const ret = (await BlogPost()).default
      return () => () => h(ret, params)
    },
  },
]

export const router = new UniversalRouter(routes)
