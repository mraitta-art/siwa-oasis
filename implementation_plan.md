# Add Collapsing Drawers to Unified Section Architect

The user wants to add two collapsing drawers to `src/app/jana/sections/page.tsx` to "facilitate work widely" (maximize horizontal screen space).

## Proposed Changes

We will refactor the UI to introduce two collapsible drawers:

### 1. Left Drawer: Sections Navigation
- The fixed left sidebar (`<nav width: 340>`) containing the list of sections will be converted into a collapsible drawer.
- We will add a toggle button (e.g., a hamburger or arrow icon) next to the "SECTION ARCHITECT" header to collapse/expand this sidebar.
- When collapsed, the main editor area will expand to fill the screen, giving you maximum horizontal space for the Field Builder.

### 2. Right Drawer: Field Editor
- Currently, when you click "Add Field" or "Edit Field", a large centered modal pops up and blocks the screen.
- We will convert this modal into a Right-Side Drawer that slides in from the right.
- This allows you to view the list of fields on the left while simultaneously editing a field on the right.

### Files to Modify
#### [MODIFY] [page.tsx](file:///e:/ANitgravity/siwatoday/siwa-oasis/src/app/jana/sections/page.tsx)
- Add state `isLeftSidebarOpen` (default `true`).
- Update the `<nav>` styles to conditionally hide or translate off-screen when collapsed.
- Add a toggle button for the left sidebar.
- Update the `editField` modal JSX to render as a right-aligned sliding drawer (`position: fixed, right: 0, height: 100vh`) with smooth transitions.

## User Review Required

> [!IMPORTANT]  
> Please confirm if this interpretation matches your vision! 
> 1. Left Drawer = The list of Sections.
> 2. Right Drawer = The Field Editor (sliding in from the right instead of a centered popup).
> 
> Does this sound like what you meant by "two collapsing drawers"? If you meant something else (like accordions inside the field builder), please let me know!
