<template>
  <transition name="fade">
    <div class="alert-container" @click.self="cancel">
      <div class="alert" @keyup.esc="cancel" @keydown.enter="validate">
        <loading v-if="alert_loading"></loading>
        <div class="alert-header" v-if="has_header">
          <slot name="header">
            <h1>{{ alert.header || 'Please confirm' }}</h1>
          </slot>
        </div>
        <div class="alert-body">
          <slot name="body">
            <p>{{ alert.message }}</p>
          </slot>
        </div>
        <div class="alert-footer" v-if="has_actions">
          <slot name="actions">
            <button
              v-if="has_cancel"
              type="button"
              @click="cancel">
              {{ cancel_label }}
            </button>
            <button
              type="button"
              ref="default"
              class="primary"
              @click="validate">
              {{ confirm_label }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'alert',
  props: {
    model: Object,
    close: Function,
    confirm: Function
  },
  data() {
    return {
      alert_loading: false
    }
  },
  mounted() {
    const default_focus = this.$refs.default
    if (default_focus) default_focus.focus()
  },
  computed: {
    class_handler() {
      return {
        full: this.type === 'full'
      }
    },
    has_header() {
      return (this.alert.header || 'header' in this.$slots)
    },
    has_actions() {
      return (this.alert.actions || this.confirm || this.close)
    },
    has_cancel() {
      return (this.alert.actions.cancel !== undefined) || this.close
    },
    confirm_label() {
      return this.alert.button_labels[0] || 'Ok'
    },
    cancel_label() {
      return this.alert.button_labels[1] || 'Cancel'
    },
    alert() {
      return this.$store.getters['app:alert']
    }
  },
  methods: {
    closeAlert() {
      if (this.close) this.close()
      this.$store.dispatch('alert_hide')
    },
    async validate(e) {
      this.alert_loading = true
      try {
        if (this.confirm) {
          await this.confirm()
        } else if (this.alert.actions.confirm) {
          await this.alert.actions.confirm()
        }
        this.closeAlert()
      } catch(err) {
        console.warn(err)
      } finally {
        this.alert_loading = false
      }
    },
    cancel() {
      if (typeof this.alert.actions.cancel === 'function') {
        this.alert.actions.cancel()
      }
      this.closeAlert()
    }
  }
}
</script>

<style lang="scss">
@import '~%/colors';
@import '~%/mixins';

.alert-container {
  @include fixed_fill;
  z-index: 9998;
  background: rgba(0,0,0, 0.6);

  .alert {
    @include fixed_center;
    background: #efefef;
    width: 600px;
    max-width: 90%;
    max-height: 80%;
    background: $color-alert-background;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0, 0.3);
    z-index: 2;
    overflow: hidden;

    .alert-header {
      padding: 0 15px;
      border-bottom: 1px solid #ddd;
      text-align: center;
    }

    .alert-body {
      position: relative;
      padding: 16px;
      max-height: calc(80vh - 140px);
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .alert-footer {
      position: relative;
      border-top: 1px solid #ddd;
      padding: 10px;
      overflow: hidden;
      text-align: right;

      button {
        padding: 0.8em 1em;
      }
    }

    h1 {
      margin: 10px 0;
      font-size: 1em;
      line-height: 2.5em;
      text-transform: uppercase;
    }

    p {
      margin: 7px 0;
    }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;

  .alert {
    transition: margin .2s;
    margin-top: 0;
  }
}
.fade-enter, .fade-leave-to {
  opacity: 0;

  .alert {
    margin-top: -20px;
  }
}
</style>
