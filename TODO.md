# TODO: Add Local Storage for Authentication Persistence and Data Storage in Booking Flow

## Current Work
Implement localStorage for user authentication persistence across the booking flow (main page.html -> searchedbuses.html -> seat-selection.html -> booking.html -> ticket.html). Add login checks on protected pages, store additional user details (name, email), search parameters, and ticket data. Display welcome message with username in navbars when logged in.

## Key Technical Concepts
- localStorage API for client-side data persistence (userId, userRole, userName, searchParams, selectedBus, bookingData, ticketData).
- JavaScript event listeners for DOMContentLoaded to check authentication and update UI.
- URLSearchParams for handling query parameters, with fallback to localStorage.
- Consistent navbar implementation across pages for user display and logout functionality.
- Redirects to login.html if not authenticated on protected pages.

## Relevant Files and Code
- **login.html**: Update login success to store userName alongside userId and userRole.
  - Current: localStorage.setItem('userId', data.userId); localStorage.setItem('userRole', data.role);
  - Add: localStorage.setItem('userName', data.full_name); (requires backend update to return full_name).
- **main page.html**: Add navbar with welcome message. Store search params in localStorage on handleSearch.
- **searchedbuses.html**: Add login check and navbar. Retrieve params from localStorage if URL missing.
- **seat-selection.html**: Add login check and navbar.
- **booking.html**: Add login check and navbar.
- **ticket.html**: Add login check and navbar. Store ticket data in localStorage after fetch.
- **routes/controllers/userController.js**: Update login response to include full_name.
- **node.js**: No changes needed.

## Problem Solving
- Backend login doesn't return full_name; update userController.js to include it.
- Pages lack consistent navbars; add a shared navbar structure to each HTML file.
- Ensure logout clears all relevant localStorage items.
- Handle cases where localStorage data might be stale or missing.

## Pending Tasks and Next Steps
1. [x] Update backend (userController.js) to return full_name in login response. Test with curl or browser.
   - "Update userController.js login function to select and return full_name."
2. [x] Update login.html to store userName in localStorage after successful login.
3. [x] Add navbar to main page.html with user welcome/logout. Store search params in localStorage on handleSearch.
4. [x] Add login check and navbar to searchedbuses.html. Fallback to localStorage for params.
5. [x] Add login check and navbar to seat-selection.html.
6. [x] Add login check and navbar to booking.html.
7. [x] Add login check and navbar to ticket.html. Store ticket data in localStorage.
8. [x] Test full flow: register/login -> search -> select bus/seats -> book -> view ticket. Verify persistence and redirects.
9. [x] Update this TODO.md with [x] marks as steps complete.

Followup: After all edits, run server, test authentication flow, verify data persistence across page reloads.
