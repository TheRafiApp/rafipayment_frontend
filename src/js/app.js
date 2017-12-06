// external libraries
import './lib'

// main Vue plugins
import Vue from 'vue'
import { mapGetters } from 'vuex'
import VeeValidate from 'vee-validate'
import VueTouch from 'vue-touch'
import VueMask from 'v-mask'
import VueModel from '@/plugins/model'
import VueCollection from '@/plugins/collection'
import VueBecome from '@/plugins/become'
import router from '@/router'
import store from '@/store'
import config from '@/config'

// validators, config, filters
import { validation_config } from '@/config/validation'
import { validators } from '@/modules/validators'
import { filters } from '@/modules/filters'

// custom components
import App from '@/components/app'
import Load from '@/components/load'
import Logo from '@/components/logo'
import Avatar from '@/components/avatar'
import Tabs from '@/components/tabs'
import Tab from '@/components/tab'
import Validation from '@/components/validation'
import Alert from '@/components/alert'
import Modal from '@/components/modal'
import Collapse from '@/components/collapse'
import Password from '@/components/password'
import Select from '@/components/select'
import InputCurrency from '@/components/currency'
import InputNumber from '@/components/number'
import IconArrowLeft from '@/components/icons/arrow_left'
import IconArrowRight from '@/components/icons/arrow_right'
import IconSuccess from '@/components/icons/success'
import IconExternal from '@/components/icons/external'

const components = [
  Load,
  Logo,
  Avatar,
  Tabs,
  Tab,
  Validation,
  Alert,
  Modal,
  Collapse,
  Password,
  Select,
  InputCurrency,
  InputNumber,
  IconArrowLeft,
  IconArrowRight,
  IconSuccess,
  IconExternal
]

const install = (Vue, opts = {}) => {
  // inject filters
  for (let key in filters) {
    Vue.filter(key, filters[key])
  }

  // inject validators
  for (let key in validators) {
    VeeValidate.Validator.extend(key, validators[key])
  }

  // inject components
  components.map(component => {
    Vue.component(component.name, component)
  })

  // inject plugins
  Vue.use(VueTouch)
  Vue.use(VueModel)
  Vue.use(VueCollection)
  Vue.use(VueBecome)
  Vue.use(VueMask)
  Vue.use(VeeValidate, validation_config)
}

const env = process.env.NODE_ENV

if (config.debug) {
  import('./debug')
}

if (env === 'cordova') {
  import('@/modules/universal_links')
}

// let analytics

// if (config.google_analytics) {
//   import('@/modules/google_analytics')
//     .then(GoogleAnalytics => {
//       analytics = new GoogleAnalytics(Vue, router)
//     })
// }

// if (config.firebase_analytics) {
//   import('@/modules/firebase_analytics')
//     .then(FirebaseAnalytics => {
//       analytics = new FirebaseAnalytics(router)
//     })
// }

install(Vue)

const app = new Vue({
  el: '.app',
  router,
  store,
  // analytics,
  template: '<App/>',
  components: { App },
  data() {
    return {
      online: navigator.onLine
    }
  },
  computed: {
    is_cordova() {
      return env === 'cordova'
    },
    ...mapGetters({
      offline: 'app:offline'
    })
  },
  beforeMount() {
    window.addEventListener('online', () => {
      this.$store.dispatch('set_offline', false)
    })
    window.addEventListener('offline', () => {
      this.$store.dispatch('set_offline', true)
    })
  },
  methods: {
    afterLeave(el) {
      window.scroll(0, 0)
    },
    alert(
      message = '',
      callback = () => {},
      title = 'Alert',
      button_label = 'OK'
    ) {
      const createAlert = this.is_cordova
        ? navigator.notification.alert
        : modalAlert.bind(this)
      return createAlert(message, callback, title, button_label)
    },
    confirm(
      message = '',
      _callback = () => {},
      title = 'Confirm',
      button_labels = ['OK', 'Cancel']
    ) {
      const createAlert = this.is_cordova
        ? navigator.notification.confirm
        : modalConfirm.bind(this)

      const callback = !this.is_cordova
        ? _callback
        : (index) => {
          if (index === 1) _callback()
        }
      return createAlert(message, callback, title, button_labels)
    }
  }
})

function modalAlert(message, callback, title, button_label) {
  return this.$store.dispatch('alert_show', {
    header: title,
    message: message,
    actions: {
      confirm: callback
    },
    button_labels: [ button_label ]
  })
}

function modalConfirm(message, callback, title, button_labels) {
  return this.$store.dispatch('alert_show', {
    header: title,
    message: message,
    actions: {
      confirm: callback,
      cancel: true
    },
    button_labels: button_labels
  })
}

export default app
module.exports = app
// using both commonjs and es modules for tests
