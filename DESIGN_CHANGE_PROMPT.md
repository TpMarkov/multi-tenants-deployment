You are working on an existing frontend project. Your task is to **apply a new design** from an external repository without altering the current functionality, structure, or logic of the application. Please when finished ask me to confirm pushing the changes to the repository, only after I confirm you are allowed to push the changes. 

### 🎯 Goal

Recreate the visual design from the repository **`design-for-multy-tenants`** and apply it to our existing frontend UI **as closely as possible**, while strictly preserving:

* All existing functionality
* All business logic
* All component structure and hierarchy
* All routing and page flow

---

### 📦 Step 1: Clone Design Repository

* Clone the repository https://github.com/TpMarkov/design-for-multy-tenants.git into a **separate, uniquely named folder** (e.g., `/temp-design-reference`)
* Do NOT integrate it directly into the main project
* Use it strictly as a **visual and styling reference**

---

### 🔍 Step 2: Analyze the Design

Carefully inspect:

* Layout structure (spacing, grids, alignment)
* Typography (font sizes, weights, line heights)
* Colors (backgrounds, text, borders, accents)
* UI components (buttons, inputs, cards, navbars, etc.)
* Responsiveness behavior
* Shadows, borders, and visual effects

---

### 🎨 Step 3: Apply Design to Existing Project

* Update ONLY:

  * CSS / Tailwind classes / styles
  * Component styling (JSX/HTML markup ONLY if necessary for styling hooks)
* Reuse existing components and structure
* Map design elements to current components instead of replacing them

---

### ⚠️ Strict Constraints (DO NOT VIOLATE)

* ❌ Do NOT change any JavaScript logic
* ❌ Do NOT modify functions, hooks, or API calls
* ❌ Do NOT rename components or files
* ❌ Do NOT restructure folders or routing
* ❌ Do NOT remove or replace existing components
* ❌ Do NOT introduce breaking changes
* ❌ Do NOT alter state management or props flow

---

### ✅ Allowed Changes

* ✔️ Add or modify classNames / styles
* ✔️ Add wrapper elements ONLY if absolutely necessary for styling
* ✔️ Introduce reusable style utilities if needed (e.g., Tailwind configs)
* ✔️ Adjust spacing and layout styles to match the design

---

### 🧪 Step 4: Verification

After applying the design:

* Ensure ALL existing features work exactly as before
* Ensure NO console errors or warnings
* Ensure UI matches the design as closely as possible
* Test key user flows to confirm nothing is broken

---

### 🧠 Important Principle

This task is **purely a visual redesign**, NOT a refactor or rebuild.

> Think of it as “skinning” the existing app with a new design, without touching its brain. 

---

### 📌 Deliverable

* Updated frontend code with redesigned UI
* No functional or structural changes
* Clean, maintainable styling consistent with the design reference

---

If you are unsure whether a change affects functionality — **DO NOT APPLY IT**.