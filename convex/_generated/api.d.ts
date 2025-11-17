/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as catalogComponents from "../catalogComponents.js";
import type * as componentConfigs from "../componentConfigs.js";
import type * as components_ from "../components.js";
import type * as importComponent from "../importComponent.js";
import type * as importComponentMutations from "../importComponentMutations.js";
import type * as projectComponents from "../projectComponents.js";
import type * as projects from "../projects.js";
import type * as seedComponentConfigs from "../seedComponentConfigs.js";
import type * as updatePreviewCode from "../updatePreviewCode.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  catalogComponents: typeof catalogComponents;
  componentConfigs: typeof componentConfigs;
  components: typeof components_;
  importComponent: typeof importComponent;
  importComponentMutations: typeof importComponentMutations;
  projectComponents: typeof projectComponents;
  projects: typeof projects;
  seedComponentConfigs: typeof seedComponentConfigs;
  updatePreviewCode: typeof updatePreviewCode;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
