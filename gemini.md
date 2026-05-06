# Engineering Guidelines: Project Duit

This document outlines the non-negotiable engineering rules and standards for Project Duit. All code generation and development must strictly adhere to these guidelines.

## Framework & Language Rules
- **Vue 3 Composition API**: All components must use `<script setup lang="ts">` syntax. Options API is strictly forbidden.
- **TypeScript Only**: All files must be TypeScript. No `.js` files anywhere in `src/`.
- **Module Bundler**: Vite is the designated bundler. Do not use Webpack, CRA, or Nuxt.
- **Node Version**: Node 20 LTS.

## State Management Rules
- **Pinia**: Global state management must use Pinia exclusively. Vuex is forbidden.
- **Domain Stores**: Each domain gets its own file: `useAuthStore`, `useTransactionStore`, `useInsightStore`, `useAnomalyStore`.
- **Setup Syntax**: Stores must use the Setup Store syntax (`defineStore` with a setup function), not the Options syntax.

## Animation Rules
- **GSAP**: All UI animations must use GSAP. CSS transitions are only allowed for hover states under 200ms.
- **Lifecycle Management**: GSAP animations must be registered in `onMounted()` and cleaned up in `onUnmounted()` using `gsap.context()`.
- **Centralized Logic**: Animation logic must reside in composables under `src/composables/animations/`.

## Component Rules
- **Organization**: Components are organized by domain: `src/components/transactions/`, `src/components/insights/`, `src/components/anomaly/`, `src/components/shared/`.
- **Exports**: Every component file must have a single named default export matching the filename.
- **Typing**: Props must be explicitly typed using TypeScript interfaces; never use `PropType<any>`.

## API Layer Rules
- **Centralized Instance**: All HTTP calls must go through the centralized Axios instance in `src/lib/api.ts`.
- **JWT Interceptor**: The Axios instance must attach the JWT Bearer token from the auth store on every request via an interceptor.
- **Typed Responses**: API response types must be defined as TypeScript interfaces in `src/types/`.
- **No Direct Fetch**: Direct `fetch()` calls in components or stores are forbidden.

## Styling Rules
- **Utility Framework**: Tailwind CSS v3.
- **Design Tokens**: Colors, spacing, and typography must be defined in `tailwind.config.ts`, never hardcoded in components.
- **Global Styles**: Global styles reside only in `src/assets/styles/main.css`.
- **Scoping**: Component-scoped styles use `<style scoped>`.

## Money & Currency Rules
- **Type Safety**: Never use JavaScript's native `number` type for currency amounts in the UI layer.
- **String Parsing**: Currency values from APIs are strings. Parse them with `formatCurrency(amount: string, currency: string)` in `src/utils/currency.ts`.
- **Format**: "RM 1,234.56" for MYR, "S$ 1,234.56" for SGD.

## Code Quality Rules
- **Linting**: ESLint with `@typescript-eslint` and `vue` plugin.
- **Formatting**: Prettier with Tab width 2, Single quotes, and No semicolons.
- **Async Handling**: All async operations in composables must handle loading and error states explicitly.
- **Logging**: No `console.log()` in committed code. Use the dedicated logger utility.

---

## Senior Engineer Behavioral Guidelines
### Think Before Coding
*   **Surface Tradeoffs**: State assumptions and highlight pros/cons regarding scalability and enterprise standards.
*   **Best Practices**: If a request violates modern practices, explain why and propose a better alternative.
*   **Clarification**: If a prompt is ambiguous, ask before proceeding.

### Simplicity & Industry Standards
*   **Minimal Viable Code**: Avoid speculative "future-proofing".
*   **No Unnecessary Abstractions**: Keep it clean and efficient.
*   **Modern Practices**: Focus on error boundaries, strong typing, and separation of concerns.

### Surgical Changes
*   **Minimal Impact**: Modify only necessary lines/files.
*   **Respect Existing Style**: Match the surrounding code style and conventions.
*   **Cleanup**: Remove any dead code or obsolete imports created by your changes.
