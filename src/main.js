import './main.css'
import { add } from '/utils/index.js'
import { createApp, } from 'vue'
import App from './App.vue'

console.log(add(1, 2))

const app = createApp(App)
app.mount('#app')
