# incomponent

## What?

This is a minimal component library that rips off most of Vue's composition API, and uses `lit-html` for rendering, `immer` for immutable state.

## Why?
IDK. I like the name of the library. You have to pronounce it with the same stress and rhythm as "incompetent". You should use Vue instead if that's somehow not a compelling enough reason.

## How?
`example.html` demonstrates pretty much the entirety of the API. It creates a trivial clicker game that interacts with state in various ways. The script part is:
```javacript
import {
  comp, html, renderRoot, ref, computed, cx, sx
} from 'https://cdn.jsdelivr.net/npm/@stevvvns/incomponent/+esm';

// react useContext-ish, vue pinia-ish stores. use an IIF to return your state
// and mutators, then import this anywhere where you want it to be "provided"
export const sharedState = (() => {
  // reactive state (react useState)
  const points = ref(0);
  // react useEffect/useMemo/useCallback
  // you could specify [points] as the second argument here to be explicit about
  // dependencies, but if you evaluate .value for every dependency on the initial
  // call of the function (rule of hooks style) you can omit it
  const doubled = computed(() => points.value * 2);
  // mutators are just functions
  function add(amount) {
    points.value += amount;
  }
  return { points, doubled, add };
})();

// <inc-example> web component. make sure your minified build does not mangle function
// names! (esbuild --keep-names, webpack terserOptions keep_fnames=true)
comp(function Example() {
  const { points, doubled } = sharedState;
  // returns become instance variables in the `template` callback, in addition to
  // all the other stuff from HTMLElement
  return { points, doubled };
})
  // refs are unwrapped for templates, so you can say el.points instead of 
  // el.points.value
  .template(
    el => html`
    <p>
      <span
        class=${cx({ red: el.points % 3 === 0})}
        style=${sx({
          backgroundColor: el.points % 5 === 0 ? 'yellow' : 'transparent'
        })
      }>
        ${el.points.toLocaleString()}
      </span>
      <inc-doubled .amount=${el.doubled}></inc-doubled>
      <slot></slot>
    </p>`
  )
  .style('span { color: purple; margin-right: 6px } .red { color: red }');

// <inc-button>
comp(
  function Button() {
    const { add } = sharedState;
    const amount = ref(1);
    return {
      inc() {
        add(amount.value);
        // it would be cleaner to directly assign to amount.value here, but you
        // may use `mut` to provide a callback that changes the value. this is
        // useful to pick up changes to arrays or deep object keys without having
        // to use spreads and the like to reconstruct the whole object. see the
        // docs for immer for better examples
        amount.mut(val => val * 2);
      },
      amount
    };
  },
  // you can provide a list of observed attributes for plain HTML interop, like if
  // you are exporting a component library. if you're just making your own app you
  // can pass data as props using lit-htmls .prop=${val} and not bother with this
  ['label']
)
  .template(
    el => html`<button @click=${el.inc}>${el.label}</button>`
  );

// <inc-doubled>
comp(function Doubled() {
  // setting a default for a prop that is expected to be provided by parent comp
  return { amount: 0 };
})
  .template(el => html`<span>(${el.amount.toLocaleString()})</span>`);

document.addEventListener('DOMContentLoaded', () => {
  renderRoot(
    html`<inc-example><inc-button label="Increment"></inc-button></inc-example>`
  );
});
```


