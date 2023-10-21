[![version(scoped)](https://img.shields.io/npm/v/stimulus-typescript.svg)](https://www.npmjs.com/package/stimulus-typescript)
[![codecov](https://codecov.io/gh/ajaishankar/stimulus-typescript/graph/badge.svg?token=DJDS9JSC3M)](https://codecov.io/gh/ajaishankar/stimulus-typescript)

# Stimulus TypeScript

### Strongly Typed Stimulus Controllers

#### Quickstart

```ts
import { Object_, Target, Typed } from "stimulus-typescript";

const values = {
  name: String,
  alias: Array<string>,
  address: Object_<{ street: string }>
}

interface CustomSelect { search: string }

const targets = {
  form: HTMLFormElement,
  select: Target<CustomSelect>
}

const outlets = { "user-status": UserStatusController }

class MyController extends Typed(Controller, { values, targets, outlets }) {
  foo() {
    this.nameValue.split(' ')
    this.aliasValue.map(alias => alias.toUpperCase())
    this.addressValue.street
    this.formTarget.submit()
    this.selectTarget.search = "stimulus"
    this.userStatusOutlets.forEach(status => status.markAsSelected(event))
  }
}
```
#### Why?

As awesome as Stimulus is, using [Typescript with Stimulus](https://stimulus.hotwired.dev/reference/using-typescript) can be a bit repetitive.

A single `value`, `target` and `outlet` means we might need to declare a bunch of properties.

```ts
static values = {
  code: String
}

declare codeValue: string
declare readonly hasCodeValue: boolean

static targets = [ "input" ]

declare readonly hasInputTarget: boolean
declare readonly inputTarget: HTMLInputElement
declare readonly inputTargets: HTMLInputElement[]

static outlets = [ "user-status" ]

declare readonly hasUserStatusOutlet: boolean
declare readonly userStatusOutlet: UserStatusController
declare readonly userStatusOutlets: UserStatusController[]
declare readonly userStatusOutletElement: Element
declare readonly userStatusOutletElements: Element[]
```

#### Stimulus Typescript

Stimulus Typescript uses the powerful type juggling capabilities of Typescript to automatically infer all these properties!

See how it works by browsing the [code](./src/index.ts) and the [tests](./src/index.test.ts)

#### Usage

1. Declare values as usual  
   
   ```ts
    const values = {
      name: String,
      alias: Array<string>,
      address: Object_<{ street: string }>
    }
   ```
2. For targets and outlets, instead of an array of strings declare a map of names to types  
   
   ```ts
    const targets = { form: HTMLFormElement, select: Target<CustomSelect> }
    const outlets = { "user-status": UserStatusController }
   ```
3. Derive from `Typed` controller and you're all set!  
   
   ```ts
    class MyController extends Typed(Controller, { values, targets, outlets }) {
      // Look Ma, no "declare ..."
      foo() {
        this.nameValue.split(' ')
        this.aliasValue.map(alias => alias.toUpperCase())
        this.addressValue.street
        this.formTarget.submit()
        this.userStatusOutlets.forEach(status => status.markAsSelected(event))
      }
    }
   ```

Give it a go and hopefully this makes your life a little bit simpler!
