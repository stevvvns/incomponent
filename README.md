# incomponent

## What?
This is a minimal component library that rips off most of Vue's composition API, and uses `lit-html` for rendering, `immer` for immutable state.

## Why?
IDK. I like the name of the library. You have to pronounce it with the same stress and rhythm as "incompetent". You should use Vue instead if that's somehow not a compelling enough reason.

## How?
`$ npm i @stevvvns/incomponent`

[`example.html`](./example.html) demonstrates pretty much the entirety of the API. It creates a trivial clicker game that interacts with state in various ways.

Cheat sheet:

| Export | Purported function |
|--|--|
| `ref(value)` | Create a reference with a `.value` property initialized with the argument. When references are changed they re-invoke all `computed` values based on them and re-render templates that reference them. |
| `computed(callback,deps = [])` | Generate a value (or just do something) when dependencies change. `deps` is combined with the list of every reference `.value` that is evaluated when `callback` is invoked for the first time. So, if you follow a "rule of hooks" style where you unconditionally access the `.value` of every reference your computed function is concerned with, you do not have to specify this parameter. |
| `html` | [`lit-html`](https://lit.dev/docs/v1/lit-html/introduction/)
| ``comp(function MyComp() {}, attrs=[]).template(el => html`<p>hello from ${el.tagName}!</p>`) `` | Creates a web component for the provided setup function and template, this one results in `<p>hello from INC-MY-COMP!</p>`. Please see [the example](./example.html) for more info on this than fits in this cell. |
| `cx`, `sx` | These are aliases for `lit-html`'s `classMap` and `styleMap` directives, respectively. You can use [more directives](https://lit.dev/docs/v1/api/lit-html/directives/) by adding `lit-html` as a direct dependency of your project. |
| ``renderRoot(html`<inc-my-app></inc-my-app>`, target='body')`` | Stamp the outermost template of your project. Target can be a CSS selector, an `HTMLElement`, or omitted to take over `<body>`. |
