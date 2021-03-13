import { h, Component } from '/web_modules/preact.js'
import hx from '../utils/hyperscript.js'
import Heading from '../components/heading.js'
import posts from '../posts.js'

const { article, span, section } = hx(h)

class BlogPost extends Component {
  constructor(props) {
    super(props)

    const permalink = (props || {}).permalink

    this.state = {
      article: posts.find(p => p.url === permalink),
    }
  }

  componentDidMount() {
    window.Prism.highlightAll()
  }

  componentDidUpdate() {
    window.Prism.highlightAll()
  }

  render() {
    if (!this.props.permalink || !this.state || !this.state.article) {
      return span('')
    }

    return article({ className: 'blog-post' }, [
      Heading(this.state.article.title),
      section({
        dangerouslySetInnerHTML: { __html: this.state.article.content },
      }),
    ])
  }
}

export default BlogPost
