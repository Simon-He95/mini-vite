const koa = require('koa')
const fs = require('fs')
const path = require('path')
const app = new koa()
app.use(async ctx => {
  // / => index.html
  const { url } = ctx.request
  if (url === '/') {
    // 入口文件添加一个全局变量process.env.NODE_ENV
    ctx.type = 'text/html'
    const content = fs.readFileSync('./index.html', 'utf-8').replace('<script', '<script>window.process ={env:{NODE_ENV:"development"}};</script><script')

    ctx.body = content
  } else if (url.endsWith('.js')) {
    // /src/main.js => xxxx/src/main.js
    ctx.type = 'application/javascript'
    const content = rewriteImport(fs.readFileSync(path.resolve(__dirname, url.slice(1)), 'utf-8'))
    ctx.body = content
  } else if (url.startsWith('/@modules/')) {
    // vue => xxx/node_modules/vue/ esmodule入口
    // 读取package.json的module
    const prefix = path.resolve(__dirname, 'node_modules', url.replace('/@modules/', ''))
    const { module } = require(prefix + '/package.json')
    // dist/vue.runtime.esm-bundler.js
    const p = path.resolve(prefix, module)
    console.log(p)

    const content = fs.readFileSync(p, 'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(content)
  }
})

function rewriteImport(content) {
  return content.replace(/ from ['|"](.*)['|"]/g, (s0, s1) => {
    if (!s1.startsWith('/') || !s1.startsWith('./')) {
      return ` from '/@modules/${s1}'`
    }
  })
}

app.listen(3000, () => {
  console.log('3000已启动')
})
