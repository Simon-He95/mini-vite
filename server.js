const koa = require('koa')
const fs = require('fs')
const path = require('path')
const app = new koa()
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')

app.use(async ctx => {
  // / => index.html
  const { url, query } = ctx.request
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
    const content = fs.readFileSync(p, 'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(content)
  } else if (url.indexOf('.vue') !== -1) {
    // 支持SFC组件 单文件组件
    // 1. *.vue => template模板  （compiler-sfc）
    const p = path.resolve(__dirname, url.split('?')[0].slice(1))
    const content = fs.readFileSync(p, 'utf-8')
    const { descriptor } = compilerSfc.parse(content)

    const modules = 'v-data-110'
    let result = ''
    if (descriptor.styles) {
      result = `
      const css = "${descriptor.styles[0].content.replace(/ {\n/g, `[${modules}] {`).replace(/\n/g, '')}"
      let link = document.createElement('style')
      link.setAttribute('type', 'text/css')
      document.head.appendChild(link)
      link.innerHTML = css
      `
    }
    if (!query.type) {
      ctx.type = "application/javascript"
      ctx.body = `
      ${result}
      ${rewriteImport(
        descriptor.script.content.replace('export default ', 'const __script =')
      )}
      import { render as __render } from "${url}?type=template"
      __script.render = __render
      export default __script
      `
    } else {
      // 2. template模板 => render函数 （compiler-dom）
      const template = descriptor.template.content
      const render = compilerDom.compile(template, {
        mode: 'module', nodeTransforms: [
          (node, content) => {
            if (node.type === 1) {
              node.props && node.props.push({
                name: modules,
                type: 6,
                loc: {
                  start: {},
                  end: {},
                  source: modules
                },
              })

            }
          }
        ]
      })
      ctx.type = 'application/javascript'
      ctx.body = rewriteImport(render.code)
    }
  } else if (url.endsWith('.css')) {
    // css 转为 js
    // 利用js 添加一个style标签
    const p = path.resolve(__dirname, url.slice(1))
    const file = fs.readFileSync(p, 'utf-8')
    const content = `
    const css = "${file.replace(/\n/g, '')}"
    let link = document.createElement('style')
    link.setAttribute('type', 'text/css')
    document.head.appendChild(link)
    link.innerHTML = css
    export default css
    `
    ctx.type = 'application/javascript'
    ctx.body = content
  }
})

function rewriteImport(content) {
  return content.replace(/ from ['|"](.*)['|"]/g, (s0, s1) => {
    if (s1.startsWith('/') || s1.startsWith('./')) {
      return s0
    }
    return ` from '/@modules/${s1}'`
  })
}

app.listen(3000, () => {
  console.log('3000已启动')
})
