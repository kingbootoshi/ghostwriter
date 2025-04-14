Okay, here is a revised Product Requirements Document (PRD) focusing on the requested changes to the "Ideas" section and dynamic category management.

---

## Product Requirements Document: Ghostwriter - v1.1 (Ideas & Categories Enhancement)

**Version:** 1.1
**Date:** 2024-08-05
**Author:** AI Assistant (based on user request)

**1. Introduction**

This document outlines the requirements for enhancing the Ghostwriter application (currently v1.0). The primary focus is to redesign the "Ideas" feature into a dedicated, full-screen management area with enhanced functionality (status, tagging, linking) and to make script categories fully dynamic and user-manageable. This addresses usability issues with the current implementation where "Ideas" is treated as a simple category and script categories are hardcoded.

**2. Goals**

*   **P1 (Must Have):** Separate "Ideas" from the script category system into its own distinct top-level section.
*   **P1:** Provide a dedicated, full-screen view for managing ideas when the "Ideas" section is selected.
*   **P1:** Implement a user-friendly method for quickly adding new ideas (e.g., chat-like input).
*   **P1:** Display ideas using a card-based layout.
*   **P1:** Implement core actions on idea cards: Edit, Delete, Mark as Good/Bad (Status).
*   **P1:** Implement functionality to link an idea to an existing script and navigate to that script from the idea card.
*   **P1:** Make script categories fully dynamic: allow users to Create, Rename, and Delete categories.
*   **P2 (Should Have):** Implement tagging functionality for ideas (add tags, display tags, filter by tags).
*   **P2:** Implement categorization specifically for ideas (separate from script categories).
*   **P3 (Could Have):** Add search/filtering capabilities within the Ideas view (by text, status, tags, category).

**3. Target Audience**

*   Content creators (YouTube, TikTok, etc.) who need a robust system for brainstorming, capturing, organizing, and developing ideas alongside their script writing.
*   Users who require flexible organization for their scripts beyond predefined categories.

**4. Functional Requirements**

**4.1. General UI & Navigation**

*   **FE-1.1 (Sidebar Update):**
    *   The sidebar navigation shall prominently feature a dedicated, non-deletable "Ideas" item at the top level (e.g., above the list of script categories).
    *   Below "Ideas", list the user-managed script categories.
*   **FE-1.2 (View Switching):**
    *   Selecting "Ideas" in the sidebar shall switch the main application area (currently Editor/Preview) to a dedicated "Ideas Management View".
    *   Selecting a script category in the sidebar shall display the list of scripts within that category, and selecting a script shall show the Editor/Preview view (existing functionality, but now with dynamic categories).

**4.2. Ideas Management View**

*   **FE-2.1 (Layout):** When "Ideas" is selected, the main view shall display:
    *   An input area for adding new ideas (see FE-3.1).
    *   A grid or list displaying existing ideas as individual cards (see FE-4.1).
    *   (P2/P3) Filtering/Sorting controls.
*   **FE-2.2 (Full Screen):** This view replaces the Editor/Preview panes; it should occupy the entire main content area next to the sidebar.

**4.3. Adding Ideas**

*   **FE-3.1 (Input Method):** Provide a prominent text input field (e.g., styled like a chat input box at the top or bottom of the Ideas view).
*   **FE-3.2 (Saving):** Pressing 'Enter' in the input field shall save the current text as a new idea. The input field should clear after saving.
*   **FE-3.3 (Display):** Newly added ideas shall immediately appear in the card display area.

**4.4. Idea Card Display & Actions**

*   **FE-4.1 (Card Content):** Each idea card shall display at minimum:
    *   The idea text content.
    *   Creation date/time.
    *   Current status (Good/Bad/Unrated).
    *   (P2) Assigned tags.
    *   (P2) Assigned idea category.
    *   Indicator if linked to a script (e.g., linked script title or an icon).
*   **FE-4.2 (Card Actions):** Each card shall provide controls (e.g., buttons, context menu) for:
    *   **Editing (P1):** Allow modifying the idea text (e.g., inline edit or opening a modal).
    *   **Deleting (P1):** Allow removing the idea (ideally with confirmation).
    *   **Setting Status (P1):** Buttons/icons to mark the idea as "Good", "Bad", or reset to "Unrated".
    *   **Linking Script (P1):** An action to associate the idea with an existing script (see FE-5.1).
    *   **(P2) Adding/Editing Tags.**
    *   **(P2) Assigning Idea Category.**

**4.5. Linking Ideas to Scripts**

*   **FE-5.1 (Linking UI):** Provide a mechanism (e.g., modal dialog triggered from the idea card) that allows the user to search/select an existing script from any category to link to the idea.
*   **FE-5.2 (Display Link):** Once linked, the idea card shall clearly indicate the linked script (e.g., display the script title as a clickable link).
*   **FE-5.3 (Navigation):** Clicking the linked script indicator on the idea card shall:
    *   Select the corresponding category in the sidebar.
    *   Select the linked script in the script list.
    *   Switch the main view back to the Editor/Preview, showing the linked script.

**4.6. Idea Organization (P2)**

*   **FE-6.1 (Tagging):**
    *   Implement a system for creating and assigning tags to ideas.
    *   Allow adding multiple tags per idea.
    *   Display tags on the idea card.
    *   (P3) Allow filtering ideas by tags.
*   **FE-6.2 (Idea Categorization):**
    *   Implement a *separate* categorization system specifically for ideas (distinct from script categories).
    *   Allow creating, renaming, deleting idea categories.
    *   Allow assigning one idea category per idea.
    *   Display the idea category on the card.
    *   (P3) Allow filtering ideas by idea category.

**4.7. Dynamic Script Category Management (P1)**

*   **FE-7.1 (Remove Hardcoding):** Remove the default "YouTube Scripts" and "TikTok Scripts" categories *if* they are currently hardcoded. Allow the database default seeding to handle initial categories if desired, but they must be manageable.
*   **FE-7.2 (Create Category):** Provide a UI mechanism (e.g., button in the sidebar near the category list) to add a new script category. Prompt the user for a name.
*   **FE-7.3 (Rename Category):** Allow users to rename existing script categories (e.g., via context menu on the category in the sidebar).
*   **FE-7.4 (Delete Category):** Allow users to delete existing script categories (e.g., via context menu). The application must handle orphaned scripts (e.g., prompt the user to reassign them or delete them).
*   **FE-7.5 (Script Assignment):** Ensure users can easily assign or move scripts between these dynamic categories.

**5. Non-Functional Requirements**

*   **NF-1 (Performance):** The Ideas view should load and scroll smoothly, even with hundreds of ideas. Database operations for tagging/linking/status should be fast.
*   **NF-2 (Usability):** The separation between Ideas and script categories should be clear. Idea management actions should be intuitive and easily accessible.
*   **NF-3 (Reliability):** Idea saving, status changes, and linking must be robust.
*   **NF-4 (Maintainability):** Implement the Ideas view and its logic in a modular way (e.g., dedicated React components, specific database service methods, distinct IPC channels).
*   **NF-5 (Data Integrity):** Deleting scripts or categories needs careful handling regarding linked ideas. Deleting a script should likely unlink it from any ideas, not delete the idea itself. Deleting a category requires handling its scripts.

**6. Technical Requirements**

*   **TR-1 (Database Schema):** Requires modifications to the `ideas` table and potentially new tables (see Section 8).
*   **TR-2 (Components):**
    *   Create a new main view component (`IdeasView.tsx` or similar) responsible for the Ideas management layout and state.
    *   Create a reusable `IdeaCard.tsx` component.
    *   Refactor `Sidebar.tsx` to handle the top-level "Ideas" item and dynamic script categories.
    *   Refactor `App.tsx` to manage the state for the active view (Ideas vs. Editor/Preview) and potentially the idea data.
*   **TR-3 (IPC):** Define new IPC channels in `main.ts` and `preload.ts` for all new idea-related operations (create, update, delete, setStatus, linkScript, manageTags, manageIdeaCategories) and for dynamic script category management (create, rename, delete).
*   **TR-4 (State Management):** Determine the best way to manage the state for ideas, tags, and idea categories within the React application.

**7. UI/UX Design Sketch**

*   **Sidebar:** "Ideas" listed first, followed by a user-managed list of script categories with "+ Add Category" button.
*   **Ideas View:**
    *   Top/Bottom: Input field spanning the width ("Type a new idea and press Enter...").
    *   Main Area: A responsive grid (or list) of cards.
    *   Cards: Contain idea text, date, status icons (e.g., 👍, 👎), tags (pills), category, link icon/text, edit/delete buttons.
*   **Linking Modal:** A simple modal with a search/dropdown to select the target script.

**8. Database Schema Changes (Proposal)**

*   **`ideas` Table:**
    *   Add `status` column (TEXT: 'good', 'bad', 'unrated' or INTEGER: 1, -1, 0). Default 'unrated'/0.
    *   Add `linkedScriptId` column (TEXT, NULLABLE, FOREIGN KEY (`scripts.id`) ON DELETE SET NULL). - *Using ON DELETE SET NULL means if a script is deleted, the link is removed from the idea, but the idea remains.*
    *   (P2) Add `ideaCategoryId` column (TEXT, NULLABLE, FOREIGN KEY (`ideaCategories.id`) ON DELETE SET NULL).
*   **(P2) `ideaCategories` Table:**
    *   `id` (TEXT, PK)
    *   `name` (TEXT, NOT NULL)
*   **(P2) `tags` Table:**
    *   `id` (TEXT, PK)
    *   `name` (TEXT, NOT NULL, UNIQUE)
*   **(P2) `idea_tags` Table (Join Table):**
    *   `ideaId` (TEXT, FOREIGN KEY (`ideas.id`) ON DELETE CASCADE)
    *   `tagId` (TEXT, FOREIGN KEY (`tags.id`) ON DELETE CASCADE)
    *   PRIMARY KEY (`ideaId`, `tagId`)
*   **`categories` Table:** No schema change needed, but application logic must treat it as fully dynamic. Ensure `ON DELETE CASCADE` for scripts is appropriate or implement alternative handling.

**9. Future Considerations**

*   Archiving ideas instead of just deleting.
*   Advanced search/filtering in the Ideas view.
*   Ability to convert an Idea directly into a new Script.
*   Ability to drag-and-drop ideas to reorder or potentially categorize (if using list view).

**10. Open Issues/Questions**

*   Exact handling of deleting a script category containing scripts? (Prompt user? Move to default? Delete scripts?)
*   Confirm if idea categories (P2) should be completely separate from script categories, or if reusing script categories for ideas is preferable. (Keeping separate for now).
*   Final UI design for idea cards and actions needs wireframing/mockups.

---