import { Application, Controller } from "@hotwired/stimulus";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { waitFor } from "@testing-library/dom";
import { Object_, Target, Typed } from ".";

// https://stackoverflow.com/questions/55541275/typescript-check-for-the-any-type
type NotAnyOrUnknown<T> = 0 extends T & 1 ? never : unknown extends T ? never : T;

const ensureValid = <T>(value: NotAnyOrUnknown<T>) => value;

class UserStatusController extends Typed(Controller<HTMLLIElement>, {}) {}

// interface exposed by some custom element
interface CustomSelect {
  search: string;
}

const values = {
  name: String,
  age: { type: Number, default: 1 },
  alive: Boolean,
  alias: Array<string>,
  address: Object_<{ street: string }>,
};
const targets = {
  form: HTMLFormElement,
  custom: Target<CustomSelect>,
};
const outlets = { "user-status": UserStatusController };

class TypecheckController extends Typed(Controller, { values, targets, outlets }) {
  checkValues() {
    const name: string = ensureValid(this.nameValue);
    const age: number = ensureValid(this.ageValue);
    const alive: boolean = ensureValid(this.aliveValue);
    const alias: string = ensureValid(this.aliasValue[0]);
    const street: string = ensureValid(this.addressValue.street);

    expect(name).toBe("Homer Simpson");
    expect(age).toBe(39);
    expect(alive).toBe(true);
    expect(alias).toBe("Max Power");
    expect(street).toBe("742 Evergreen Terrace");

    const a: boolean = ensureValid(this.hasNameValue);
    const b: boolean = ensureValid(this.hasAgeValue);
    const c: boolean = ensureValid(this.hasAliveValue);
    const d: boolean = ensureValid(this.hasAliasValue);
    const e: boolean = ensureValid(this.hasAddressValue);

    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(c).toBe(true);
    expect(d).toBe(true);
    expect(e).toBe(true);

    // values should be writable
    this.nameValue = "Max Power";
  }

  checkTargets() {
    const exists: boolean = ensureValid(this.hasFormTarget);
    const target: HTMLFormElement = ensureValid(this.formTarget);
    const targets: HTMLFormElement[] = ensureValid(this.formTargets);

    expect(exists).toBe(true);
    expect(target).toBeTruthy();
    expect(targets.length).toBe(1);
    expect(target).toBeInstanceOf(HTMLFormElement);

    const customExists: boolean = ensureValid(this.hasCustomTarget);
    const customTarget: CustomSelect = ensureValid(this.customTarget);
    const customTargets: CustomSelect[] = ensureValid(this.customTargets);

    expect(customExists).toBe(true);
    expect(customTarget).toBeTruthy();
    expect(customTargets.length).toBe(1);
    // just checking custom prop access
    expect(customTarget.search).toBe(undefined);
  }

  checkOutlets() {
    const exists: boolean = ensureValid(this.hasUserStatusOutlet);
    const outlet: UserStatusController = ensureValid(this.userStatusOutlet);
    const outlets: UserStatusController[] = ensureValid(this.userStatusOutlets);
    const element: HTMLLIElement = ensureValid(this.userStatusOutletElement);
    const elements: HTMLLIElement[] = ensureValid(this.userStatusOutletElements);

    expect(exists).toBe(true);
    expect(outlet).toBeTruthy();
    expect(outlets.length).toBe(1);
    expect(element).toBeTruthy();
    expect(elements.length).toBe(1);
    expect(element).toBeInstanceOf(HTMLLIElement);
  }

  checkStatics() {
    const ControllerClass = TypecheckController as any;
    const values = ControllerClass.values;
    const targets = ControllerClass.targets;
    const outlets = ControllerClass.outlets;

    expect(values["name"]).toBe(String);
    expect(values["age"]).toEqual({ type: Number, default: 1 });
    expect(values["alive"]).toBe(Boolean);
    expect(values["alias"]).toBe(Array);
    expect(values["address"]).toBe(Object);
    expect(targets).toEqual(["form", "custom"]);
    expect(outlets).toEqual(["user-status"]);
  }
}

function waitUntil(predicate: () => boolean) {
  return waitFor(() => expect(predicate()).toBe(true));
}

const html = `
  <div id="typecheck" data-controller="typecheck" data-typecheck-user-status-outlet=".user-status"
    data-typecheck-name-value="Homer Simpson"
    data-typecheck-age-value="39"
    data-typecheck-alive-value="true"
    data-typecheck-alias-value='["Max Power"]'
    data-typecheck-address-value='{ "street": "742 Evergreen Terrace" }'>
      <ul>
        <li data-controller="user-status" class="user-status"></li>
      </ul>
      <form data-typecheck-target="form"></form>
      <div data-typecheck-target="custom"></div>
  </div>
`;

describe("stimulus typescript", () => {
  let application: Application;

  function getController<T = TypecheckController>(identifier = "typecheck") {
    return waitFor(() => {
      const controller = application.getControllerForElementAndIdentifier(
        document.querySelector(`#${identifier}`)!,
        identifier
      ) as T;
      expect(controller).not.toBe(null);
      return controller;
    });
  }

  beforeEach(() => {
    document.body.innerHTML = html;
    application = Application.start();
    application.register("typecheck", TypecheckController);
    application.register("user-status", UserStatusController);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should initialize typed controller", async () => {
    const controller = await getController();
    await waitUntil(() => controller.userStatusOutlets.length > 0);

    controller.checkValues();
    controller.checkTargets();
    controller.checkOutlets();
    controller.checkStatics();
  });

  it("should be able to inherit from typed controller", async () => {
    const values = {
      planet: { type: Object_<{ name: String }> },
    };
    class Derived extends Typed(TypecheckController, { values }) {}

    application.register("derived", Derived);

    document.body.innerHTML = html
      .replace('id="typecheck"', `id="derived" data-derived-planet-value='{ "name": "Earth" }'`)
      .replace('data-controller="typecheck', 'data-controller="derived"')
      .replace("data-typecheck", "data-derived");

    const controller = await getController<Derived>("derived");
    await waitUntil(() => controller.userStatusOutlets.length > 0);

    expect(controller.planetValue.name).toBe("Earth");
  });
});

it("should fix missing test coverage", () => {
  new Object_();
});
