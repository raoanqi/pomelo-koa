const http = require('http')
const context = require('./context')
const request = require('./request')
const response = require('./response')

class Application {
  /**
   * 构造器：
   * 其中包含了用户添加的中间件数组
   */
  constructor() {
    // 保存用户添加的中间件
    this.middlewares = []
    this.context = Object.create(context)
    this.request = Object.create(request)
    this.response = Object.create(response)
  }

  /**
   * listen方法
   * @param args
   */
  listen(...args) {
    const server = http.createServer(this.callback())
    server.listen(...args)
  }

  /**
   * 挂载用户添加的中间件
   * @param fn
   */
  use(fn) {
    this.middlewares.push(fn)
  }

  /**
   * 异步递归遍历调用中间件处理函数
   */
  compose(middleware) {
    return function (context) {
      const dispatch = (index) => {
        // 如果已经遍历完所有中间件，则返回一个空promise
        if (index >= middleware.length) return Promise.resolve()
        // 获取当前中间件处理函数
        const fn = middleware[index]
        // 执行中间件处理函数，并传入一个dispatch方法，用于递归调用，这里有可能fn并不是返回一个Promise，因此这里强制使用Promise.resolve进行包裹
        return Promise.resolve(fn(context, () => dispatch(index + 1)))
      }
      // 返回第一个中间件处理函数
      return dispatch(0)
    }
  }

  // 构造context对象
  createContext() {}

  callback() {
    const fnMiddleware = this.compose(this.middlewares)
    const handleRequest = (req, res) => {
      // 每个请求都会创建一个独立的context对象，它们之间并不会互相影响
      const context = this.createContext()
      fnMiddleware(context)
        .then(() => {
          console.log('end')
          res.end('You will success!')
        })
        .catch((error) => {
          console.log(error)
        })
    }
    return handleRequest
  }
}

module.exports = Application
