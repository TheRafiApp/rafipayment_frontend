import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { Request, Deferred } from '@/utils'
import store from '@/store'
import UserModel from '@/models/user'

// const config = {
//   tokens: {
//     Authorization: store.getters['session:auth_token'],
//     Authentication: localStorage.getItem('refresh_token'),
//     Activation: localStorage.getItem('activation_token')
//   }
// }
// console.log({store});

import VueModel from '@/plugins/model'
Vue.use(VueModel)

export default new Vue({
  name: 'session',
  store,
  data() {
    return {
      deviceready: null
    }
  },
  models: {
    user() {
      return new UserModel(null, {
        name: 'session_user',
        url: 'account/',
        persist: true
      })
    }
  },
  computed: {
    ...mapGetters({
      logged_in: 'session:logged_in',
      primary_funding_source: 'session:primary_funding_source'
    })
  },
  methods: {
    checkAuth() {
      return this.logged_in
    },
    request(url = '', options = {}) {
      const Authorization = this.$store.getters['session:auth_token']
      const Refresh = localStorage.getItem('refresh_token')
      const Activation = localStorage.getItem('activation_token')

      const headers = {
        Authorization,
        Activation,
        Refresh
      }
      const defaults = {
        method: 'GET',
        headers
      }
      options = _.merge({}, defaults, options)

      const request = new Request(url, options)
      const deferred = new Deferred()

      request.then((response) => {
        if (_.get(response, 'error') === 'token_expired') {
          this.loadSession()
          .then(() => {
            this.request(url, options)
            .then((response) => {
              deferred.resolve(response)
            })
          })
        } else {
          deferred.resolve(response)
        }
      })
      .catch((error) => {
        deferred.reject(error)
      })
      return deferred.promise
    },
    loadActivation(token) {
      const body = { token }
      this.$store.dispatch('loading_begin')
      const request = this.request('users/activate/contact', {
        method: 'PUT',
        body
      })
      request.then((response) => {
        this.dispatchActivate(response)
      })
      .catch((error) => {
        console.warn(error)
      })
      .then(() => {
        this.$store.dispatch('loading_end')
      })
      return request
    },
    loadSession() {
      const token = localStorage.getItem('refresh_token')
      if (token === 'undefined') {
        return localStorage.removeItem('refresh_token')
      }
      const promise = !token ? Promise.reject('No token') : this.request('users/tokens')
        .then(response => {
          this.dispatchLogin(response)
        })
        .catch((error) => {
          console.warn(error)
        })
        .then(() => {
          this.$store.dispatch('loading_end')
        })

      return promise
    },
    login(credentials) {
      let body = {
        email: credentials.email,
        password: credentials.password
      }

      this.bindDeviceData(body)

      const request = this.request('users/login', {
        method: 'POST',
        body
      })
      request.then(response => {
        this.dispatchLogin(response)
      })
      .catch(() => {})
      .then(() => {
        this.$store.dispatch('loading_end')
      })
      return request
    },
    logout() {
      this.$store.dispatch('loading_begin')

      let body = {}
      this.bindDeviceData(body)

      const request = this.request('users/logout', {
        method: 'POST',
        body
      })
      request.catch(() => {})
      .then(response => {
        this.$store.dispatch('logout')
        this.clearSessionUser()
      })
      return request
    },
    update() {
      return this.request('account/')
      .then((user) => {
        this.$store.dispatch('update', user)
      })
    },
    dispatchActivate(user) {
      this.$store.dispatch('activate', user)
      this.$user = this.$store.getters['session:user']
      if (_.get(this.$user, 'dwolla_account.customer_id')) {
        this.fetchFundingSources()
      }
    },
    dispatchLogin(user) {
      this.$store.dispatch('login', user)
      this.bindSessionUser()
    },
    bindDeviceData(body) {
      if (process.env.NODE_ENV === 'cordova') {
        const registrationId = localStorage.getItem('registrationId')
        if (registrationId) _.set(body, 'device.id', registrationId)
        const platformId = localStorage.getItem('platformId')
        if (platformId) _.set(body, 'device.type', platformId)
      }
    },
    bindSessionUser() {
      this.$user = this.$store.getters['session:user']
      this.checkForActionsRequired()
    },
    checkForActionsRequired() {
      const actions_required = this.$user.secondary_steps
      if (_.get(actions_required, 'length')) {
        this.$store.dispatch('set_actions_required', actions_required)
      }
      this.fetchFundingSources()
      return actions_required
    },
    fetchFundingSources() {
      if (!['tenant'].includes(this.$user.role)) return
      const path = this.logged_in ? 'account' : 'tenants/activate'

      return this.request(path + '/funding_sources')
        .then((response) => {
          this.$store.dispatch('set_funding_sources', response)
          this.setPrimaryFundingSource(response)
        })
    },
    setPrimaryFundingSource(funding_sources) {
      const primary_id = _.get(this.$user, 'dwolla.primary_funding_source')
      const primary = funding_sources.find((funding_source) => {
        return funding_source.id === primary_id
      })
      // NOTE: if there is no primary, pass empty object so watchers will fire
      this.$store.dispatch('set_primary_funding_source', primary || {})
    },
    clearSessionUser() {
      this.$user.reset()
    }
  }
})
