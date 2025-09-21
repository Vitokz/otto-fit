import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

if (import.meta.env.DEV || window.location.search.includes('debug=true')) {
  import('eruda').then(eruda => eruda.default.init())
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
