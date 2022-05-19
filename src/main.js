// import './main.css'
// import { add } from '/utils/index.js'
import { createApp, h } from 'vue'

// console.log(add(1, 2))
const App = {
  render() {
    return h('div', 'Hello World')
  }
}
console.log(App)

const app = createApp(App)
console.log(app)
app.mount('#app')
