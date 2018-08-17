/**
 Polymer element for Google reCAPTCHA

 See https://github.com/cbalit/re-captcha

 BEWARE: THE re-captcha ELEMENT ONLY WORKS IN THE DOM OR LIGHT DOM OF ANOTHER COMPONENT. IT WON'T BE ABLE TO RESOLVE IF IS IS IN THE SHADOW DOM.


 ##### Example
 ```html
 <re-captcha sitekey="yoursitekey"></re-captcha>
 ```

 @element google-captcha
 @blurb Element for Google reCAPTCHA
 @status alpha
 @homepage https://github.com/cbalit/re-captcha
 @demo demo/index.html
 */
import {IronResizableBehavior} from '@polymer/iron-resizable-behavior/iron-resizable-behavior.js';
import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';
import {IronValidatorBehavior} from "@polymer/iron-validator-behavior";

class Recaptcha extends mixinBehaviors([IronResizableBehavior], PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <slot></slot>
      <div id="spanner"></div>
      `;
  }

  static get properties() {
    return {
      SCRIPT_LOADED: {
        type: Boolean,
        value: false
      },
      _API_URL: {
        type: String,
        value: 'https://www.google.com/recaptcha/api.js'
      },
      _RETRY_DELAY: {
        type: Number,
        value: 200
      },
      _delay: {
        type: Number,
        value: 0
      },
      _captchaId: {
        type: String,
        value: ''
      },
      _container: {
        type: Object,
        value: null
      },

      /**
       * The total time (in milliseconds) to wait for API loading
       *
       * @attribute timeout
       * @type number
       * @default 3000
       */
      timeout: {
        type: Number,
        value: 3000
      },
      /**
       * Your sitekey
       *
       * (Provided on registration -- see https://developers.google.com/recaptcha/docs/start)
       *
       * @attribute sitekey
       * @type string
       * @required
       * @default ''
       */
      sitekey: {
        type: String,
        value: ''
      },
      /**
       * The color theme of the widget (`dark` or `light`)
       *
       * @attribute theme
       * @type string
       * @default 'light'
       */
      theme: {
        type: String,
        value: 'light'
      },
      /**
       * The type of reCaptcha to serve (`image` or `audio`)
       *
       * @attribute type
       * @type string
       * @default 'image'
       */
      type: {
        type: String,
        value: 'image'
      },
      /**
       * The tabindex of the widget and challenge
       *
       * If other elements in your page use tabindex, this should be set to make user navigation easier.
       *
       * @attribute tabindex
       * @type string
       * @default 0
       */
      tabindex: {
        type: Number,
        value: 0
      },

      /**
       * The response from the reCaptcha API
       *
       * @attribute response
       * @type string
       * @default ''
       */
      response: {
        type: String,
        value: '',
        notify: true
      },

      /**
       * The lang attribute
       *
       * @attribute lang
       * @type string
       * @default ''
       */
      lang: {
        type: String,
        value: '',
        notify: true
      }
    }
  }

  static get observers() {
    return [
      '_validate(theme, type, timeout)'
    ]
  }

  constructor() {
    super();
    this.addEventListener('iron-resize', e => this._onIronResize())
  }

  _validate() {
    if (this.theme != 'dark' && this.theme != 'light') {
      this.theme = 'light';
    }
    if (this.type != 'audio' && this.type != 'image') {
      this.type = 'image';
    }
    if (isNaN(this.timeout)) {
      this.timeout = 3000;
    }
  }

  _onIronResize() {
    console.log("resize");
    if (!this._container) return;
    var crect = this._container.querySelector('div').getBoundingClientRect();
    this.$$('#spanner').style.width = crect.width + 'px';
    this.$$('#spanner').style.height = crect.height + 'px';
    var srect = this.$$('#spanner').getBoundingClientRect();
    this._container.style.top = srect.top + 'px';
    this._container.style.left = srect.left + 'px';
  }

  /**
   * The `removeCaptcha` method allow to remove widget and script.
   *
   * @method removeCaptcha
   */
  removeCaptcha() {
    //clean captcha flag
    this._captchaId = "";
    window.grecaptcha = null;
    //Remove script
    this._removeScriptApiTag();
    //remove container
    document.body.removeChild(this._container);
    this._container = null;
  }

  /**
   * The `reload` method allow to reload captcha widget (after changing the lang property for example).
   *
   * @method reload
   */
  reload() {
    this.removeCaptcha();
    //recreate everything
    this._generateScriptApiTag();
    this._generateContainer();
    this._renderWhenApiReady();
  }

  _resetScriptLoaded() {
    this.SCRIPT_LOADED = false;
  }

  _removeScriptApiTag() {
    var script = document.querySelector('script#captcha');
    var head = document.getElementsByTagName('head')[0];
    if (script) {
      head.removeChild(script);
      this.SCRIPT_LOADED = false;
    }
  }

  _generateScriptApiTag() {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('id', 'captcha');
    script.setAttribute('defer', '');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', this._API_URL);
    if (!this.lang) {
      script.setAttribute('src', this._API_URL);
    }
    else {
      script.setAttribute('src', this._API_URL + '?hl=' + this.lang);
    }
    head.appendChild(script);
    this.SCRIPT_LOADED = true;
  }

  attached() {
    afterNextRender(this, function () {
      if (this.sitekey === '') {
        throw new Error("sitekey attribute is mandatory for recaptcha element");
      }
      if (!this.SCRIPT_LOADED) {
        this._generateScriptApiTag();
      }
      if (!this.isWidgetLoaded()) {
        this._generateContainer();
        this._renderWhenApiReady();
      }
    });
  }

  _generateContainer() {
    if (this._container === null) {
      this._container = document.createElement('div');
      this._container.className = "recaptcha-container"
      //this.appendChild(this._container);
      document.body.appendChild(this._container);
    }
  }

  _renderWhenApiReady() {
    if (!window.grecaptcha) {
      //Check if we can try again according to timeout
      if (this._delay < this.timeout) {
        setTimeout(function () {
          this._renderWhenApiReady()
        }.bind(this), this._RETRY_DELAY);
        //increment delay to check timeout
        this._delay += this._RETRY_DELAY;
      }
      else {
        //We reach the timeout value
      }
    }
    else {
      this._render();
    }
  }

  /**
   * The `captcha-rendered` event is fired whenever the captcha widget is rendered.
   *
   * @event captcha-rendered
   */
  /**
   * The `render` method renders the container as a reCaptcha widget and store the ID of the newly created widget.
   *
   * @method render
   */
  _render() {
    //Render call
    console.log(this._container)
    this._captchaId = window.grecaptcha.render(this._container, {
      sitekey: this.sitekey,
      theme: this.theme,
      type: this.type,
      tabindex: this.tabindex,
      callback: this._responseHandler.bind(this),
      'expired-callback': this._expiredHandler.bind(this)
    });
    this.fire('iron-resize');
    this.fire('captcha-rendered', null);
  }

  /**
   * The `reset` method resets the reCaptcha widget.
   *
   * @method reset
   */
  reset() {
    window.grecaptcha.reset(this._captchaId);
  }

  /**
   * The `getResponse` method gets the response for the reCaptcha widget.
   *
   * @method getResponse
   * @return {String} Returns the response.
   */
  getResponse() {
    try {
      var resp = window.grecaptcha.getResponse(this._captchaId);
    } catch (err) {
      console.error(err.message);
      return "";
    }
    return resp;
  }

  /**
   * The `captcha-response` event is fired whenever we
   * get the response from the reCaptcha API.
   *
   * @event captcha-response
   * @param {Object} detail
   * @param {string} detail.response The response
   */

  /**
   * The `responseHandler` method will store the response and fire the captcha-response. At least
   * it will dispatch a captcha-response event with the response
   *
   *  @method responseHandler
   *  @param {String} response response to store
   */
  _responseHandler(response) {
    this.response = response;
    this.fire('captcha-response', {response: response});
  }

  /**
   * The `captcha-expired` event is fired when the recaptcha response expires and the user
   * needs to solve a new CAPTCHA.
   *
   * @event captcha-expired
   */

  /**
   * The `expiredHandler` method fires the captcha-expired event.
   *
   *  @method expiredHandler
   */
  _expiredHandler() {
    this.fire('captcha-expired');
  }

  /**
   * The `isWidgetLoaded` method return true if the reCaptcha widget has been loaded.
   *
   * @method isWidgetLoaded
   * @return {boolean} true if the captcha widget is loaded
   */
  isWidgetLoaded() {
    return this._captchaId !== "";
  }
}

window.customElements.define('re-captcha', Recaptcha);