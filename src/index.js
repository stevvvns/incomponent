import { produce } from 'immer';
import { html, svg, render } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

const cx = classMap;
const sx = styleMap;
export { html, svg, cx, sx, unsafeHTML };

class Ref {
  constructor(value) {
    this._value = value;
  }

  static forComputed(cb, deps) {
    const depSet = new Set(deps);
    Ref.spy = (r) => depSet.add(r);
    const value = cb();
    Ref.spy = null;

    const rv = new Ref(value);
    rv.compute = cb;
    for (const dep of depSet) {
      dep.onChange(() => (rv.value = cb()));
    }

    return rv;
  }

  static spy = null;
  mutListeners = [];
  compute = null;

  get value() {
    if (Ref.spy) {
      Ref.spy(this);
    }
    return this._value;
  }

  set value(value) {
    if (value === this._value) {
      return;
    }
    this._value = value;
    for (const cb of this.mutListeners) {
      cb(this._value);
    }
  }

  mut(cb) {
    this.value = produce(this.value, cb);
  }

  onChange(cb) {
    this.mutListeners.push(cb);
  }

  toString() {
    return `Ref: ${this.value}`;
  }
}

export function ref(value) {
  return new Ref(value);
}

export function computed(cb, deps = [], dbg = false) {
  return Ref.forComputed(cb, deps, dbg);
}

const prefix = 'inc';
export function comp(setup, observeAttrs = []) {
  const camelName = typeof setup === 'string' ? setup : setup.name;
  const name = camelName.replace(/([A-Z])/g, '-$1').toLowerCase();
  let template = () => html``;
  const styleSheet = new CSSStyleSheet();
  let initializer = () => {};
  const dashedAttrs = observeAttrs.map((name) =>
    name.replace(/([A-Z])/g, (ma) => '-' + ma[0].toLowerCase()),
  );

  const klass = class extends HTMLElement {
    static observedAttributes = dashedAttrs;
    willRender = null;
    isInitialized = false;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.props = {
        ...dashedAttrs.reduce((acc, attr) => ({ ...acc, [attr]: null }), {}),
        ...((typeof setup === 'string' ? () => {} : setup)() ?? {}),
      };
      for (const [prop, val] of Object.entries(this.props)) {
        this._setProp(prop, typeof val === 'function' ? val.bind(this) : val);
        Object.defineProperty(this, prop, {
          get() {
            const rv = this.props[prop];
            if (this.rendering && rv instanceof Ref) {
              return rv.value;
            }
            return rv;
          },
          set(val) {
            this._setProp(prop, val);
            this.render();
          },
        });
      }
      this.shadowRoot.adoptedStyleSheets = [styleSheet];
    }

    _setProp(prop, val) {
      this.props[prop] = val;
      if (val instanceof Ref) {
        val.onChange(() => {
          this.render();
        });
      }
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback(prop, _oldVal, val) {
      for (const name of [
        prop,
        prop.replace(/-(.)/g, (ma) => ma[1].toUpperCase()),
      ]) {
        if (this.props[name] instanceof Ref) {
          this.props[name].value = val;
        } else {
          this.props[name] = val;
        }
      }
      this.render();
    }

    render() {
      if (this.willRender !== null) {
        cancelAnimationFrame(this.willRender);
      }
      this.willRender = requestAnimationFrame(() => {
        this.rendering = true;
        render(template(this), this.shadowRoot);
        this.rendering = false;
        if (!this.isInitialized) {
          initializer(this);
          this.isInitialized = true;
        }
        this.willRender = null;
      });
    }

    emit(evt, detail = {}) {
      this.dispatchEvent(
        new CustomEvent(evt, { bubbles: true, composed: true, detail }),
      );
    }
  };
  customElements.define(prefix + name, klass);

  const rv = {
    template(tpl) {
      template = typeof tpl === 'function' ? tpl : () => tpl;
      return rv;
    },
    style(style) {
      styleSheet.replaceSync(style);
      return rv;
    },
    init(cb) {
      initializer = cb;
      return rv;
    },
  };
  return rv;
}

export function renderRoot(html, el = 'body') {
  render(html, typeof el === 'string' ? document.querySelector(el) : el);
}
