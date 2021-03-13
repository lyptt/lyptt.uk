import { h } from '/web_modules/preact.js'
import hx from '../utils/hyperscript.js'
import { history } from '../history.js'

const { a, span } = hx(h)

const Hyperlink = (
  { opensExternally, href, target, standalone },
  children,
  ...props
) => {
  if (opensExternally) {
    return a({ ...props, href, target, noFollow: true, noReferer: true }, [
      span({ className: standalone ? 'standalone' : '' }, [span({}, children)]),
    ])
  } else {
    return a(
      {
        ...props,
        href,
        target,
        onClick: e => {
          e.preventDefault()
          history.push(href)
        },
      },
      [
        span({ className: standalone ? 'standalone' : '' }, [
          span({}, children),
        ]),
      ]
    )
  }
}

export default Hyperlink
