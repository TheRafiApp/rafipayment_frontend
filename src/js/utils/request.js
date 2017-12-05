import _ from 'lodash'
import 'whatwg-fetch'
import config from '@/config'

// return error data from request

export const handleXHRErrors = (response) => {
  let json = response.json()
  if (!response.ok) {
    // handle api deprecation :)
    json.then(async (error) => {
      if (error.error === 'deprecated') {
        const app = await import('@/app')
        app.alert(
          'We have released a new version of the Rafi Payment platform. You must update to the latest version of the app to continue.',
          null,
          'App Updated'
        )
      }
    })
    return json.then(
      Promise.reject.bind(Promise)
    )
  }
  return json
}

// show an app alert if xhr times out
export const handleTimeout = (error) => {
  if (error.message === 'request_timeout') {
    const app = require('@/app')
    app.alert(
      'The request timed out',
      null,
      'Timed out'
    )
  }
}

// generic, unauthenticated XHR

export const timeout_duration = 20000

export default function Request(url = '', {
  method = 'GET',
  body,
  headers = {}
} = {}) {
  if (body) body = JSON.stringify(body)
  if (!/^https?:\/\//i.test(url)) {
    url = config.urls.api + url
  }
  headers = new Headers(
    _.pickBy(headers, _.identity)
  )
  const race = Promise.race([
    fetch(url, {
      method,
      headers,
      body
    })
    .then(handleXHRErrors),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('request_timeout'))
      }, timeout_duration)
    })
  ])
  race.catch(handleTimeout)
  return race
}

// const _headers = new Headers()

// for (let key in headers) {
//   if (headers[key]) _headers.append(key, headers[key])
// }

// side effects?
// headers = _headers

// export default class Request {
//   constructor(url = '', {
//     method = 'GET',
//     body,
//     headers = {}
//   } = {}) {
//     this.url = !/^https?:\/\//i.test(url)
//       ? config.urls.api + url
//       : url
//     this.method = method
//     if (body) this.body = JSON.stringify(body)
//     this.headers = headers
//     return this.init()
//   }
//   init() {
//     const headers = new Headers()
//     for (let key in this.headers) {
//       if (this.headers[key]) {
//         headers.append(key, this.headers[key])
//       }
//     }
//     const race = Promise.race([
//       fetch(this.url, {
//         method: this.method,
//         body: this.body,
//         headers
//       })
//       .then(handleXHRErrors),
//       new Promise(function (resolve, reject) {
//         setTimeout(() => {
//           reject(new Error('request_timeout'))
//         }, timeout_duration)
//       })
//     ])
//     race.catch(handleTimeout)
//     return race
//   }
//   retry() {
//     return this.init()
//   }
// }
