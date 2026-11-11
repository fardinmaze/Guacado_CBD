import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/tokens.css'
import './assets/styles/base.css'
import { initTracking } from './utils/track'

initTracking()

createApp(App).use(router).mount('#app')
