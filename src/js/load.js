// core packages
import Vue from 'vue';
import session from './session'
import VueBecome from './plugins/become'

// error tracking
import './modules/sentry'

// components
import loading from './components/load'

// global styles
import '../scss/styles.scss'

Vue.use(VueBecome)
Vue.config.productionTip = false

const env = process.env.NODE_ENV

if (env === 'cordova') {
  import('./modules/push_notifications')
}

// load session state before rendering app
export default new Vue({
  el: '#app',
  template: `
    <div class="app-container">
      <loading v-if="loading" />
      <div class="app" />
    </div>`,
  components: { loading },
  data() {
    return {
      loading: true
    }
  },
  computed: {
    ready() {
      return env === 'cordova' ? session.deviceready : true
    }
  },
  created() {
    if (env === 'ui') {
      this.loadApp()
    } else {
      this.init()
    }
  },
  methods: {
    init() {
      session.loadSession()
        .catch(() => {})
        .then(response => {
          this.loadApp()
        })
    },
    async loadApp() {
      await this.$become('ready', true)
      this.loading = false
      import('@/app')
    }
  }
})
