# Test Cases for MCPTES-3 (UIStory)

Story: https://sasiapitest.atlassian.net/browse/MCPTES-3
App Under Test: https://the-internet.herokuapp.com

---

## TC1 [Positive] - MCPTES-6
**Summary:** Dropdown - Select Option 1 reflects correct selection
**AC:** Dropdown page - selecting Option 1 is correctly reflected as the chosen value.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dropdown
2. Locate the dropdown element (#dropdown)
3. Select "Option 1" from the dropdown
4. Read the current selected value of the dropdown

**Expected Result:** Dropdown displays "Option 1" as the selected value; selectedValue="1"

---

## TC2 [Positive] - MCPTES-7
**Summary:** Dropdown - Select Option 2 reflects correct selection
**AC:** Dropdown page - selecting Option 2 is correctly reflected as the chosen value.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dropdown
2. Locate the dropdown element (#dropdown)
3. Select "Option 2" from the dropdown
4. Read the current selected value of the dropdown

**Expected Result:** Dropdown displays "Option 2" as the selected value; selectedValue="2"

---

## TC3 [Negative] - MCPTES-8
**Summary:** Dropdown - Default state has no option selected
**AC:** Dropdown page on initial load shows placeholder, not Option 1/2.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dropdown
2. Read the current selected value without any interaction

**Expected Result:** Dropdown defaults to "Please select an option" (disabled, value="")

---

## TC4 [Positive] - MCPTES-9
**Summary:** Dynamic Content - Content changes between page loads
**AC:** Dynamic Content page content changes between loads.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_content
2. Capture text/image content of all content rows
3. Reload the page
4. Capture text/image content again
5. Compare both sets

**Expected Result:** At least one content row differs between the two page loads

---

## TC5 [Negative] - MCPTES-10
**Summary:** Dynamic Content - Page renders content on initial load (not blank)
**AC:** Dynamic content page shows non-empty rows on first load.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_content
2. Check that content rows are present and non-empty

**Expected Result:** Content rows exist and contain non-empty text

---

## TC6 [Positive] - MCPTES-11
**Summary:** Dynamic Controls - Enable button enables the checkbox (textbox)
**AC:** Dynamic Controls page - clicking Enable toggles the input from disabled to enabled.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_controls
2. Verify textbox is initially disabled
3. Click the "Enable" button
4. Wait for "It's enabled!" message
5. Check enabled state of textbox

**Expected Result:** Textbox transitions from disabled to enabled; "It's enabled!" message shown

---

## TC7 [Negative] - MCPTES-12
**Summary:** Dynamic Controls - Textbox is disabled before Enable is clicked
**AC:** Dynamic Controls - before clicking Enable, the input is in disabled state.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_controls
2. Without clicking any button, check the disabled attribute of the textbox

**Expected Result:** Textbox has disabled attribute set (not interactable) on page load

---

## TC8 [Positive] - MCPTES-13
**Summary:** Dynamic Controls - Remove button removes input field from DOM
**AC:** Dynamic Controls - clicking Remove removes the checkbox from DOM with loading indicator.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_controls
2. Verify checkbox is present in DOM
3. Click "Remove" button
4. Observe loading indicator appears
5. Wait for "It's gone!" message
6. Check checkbox is no longer in DOM

**Expected Result:** Checkbox removed from DOM; "It's gone!" shown; loading indicator appeared during transition

---

## TC9 [Positive] - MCPTES-14
**Summary:** Dynamic Controls - Add button re-adds input field to DOM
**AC:** Dynamic Controls - clicking Add re-adds the checkbox to the DOM.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_controls
2. Click "Remove" and wait for "It's gone!"
3. Click "Add" button
4. Wait for "It's back!" message
5. Verify checkbox is present in DOM again

**Expected Result:** Checkbox re-added to DOM; "It's back!" message shown

---

## TC10 [Positive] - MCPTES-15
**Summary:** Dynamic Loading Ex1 - Loading bar shown then Hello World becomes visible
**AC:** Dynamic Loading Ex1 - Start shows loading bar, then hidden Hello World becomes visible.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_loading/1
2. Verify #finish div exists in DOM but is hidden (display:none)
3. Click "Start" button
4. Verify loading bar appears
5. Wait for loading to complete
6. Verify #finish div is now visible

**Expected Result:** Loading bar visible during loading, disappears when done; Hello World transitions from hidden to visible (was in DOM all along)

---

## TC11 [Negative] - MCPTES-16
**Summary:** Dynamic Loading Ex1 - Hello World hidden before Start is clicked
**AC:** Dynamic Loading Ex1 - Hello World element exists in DOM but is hidden before Start.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_loading/1
2. Without clicking Start, check the #finish div visibility

**Expected Result:** #finish div exists in DOM with display:none (hidden but present)

---

## TC12 [Positive] - MCPTES-17
**Summary:** Dynamic Loading Ex2 - Loading bar shown then Hello World rendered into DOM
**AC:** Dynamic Loading Ex2 - Start shows loading bar, Hello World is newly rendered into DOM.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_loading/2
2. Verify #finish div does NOT exist in DOM
3. Click "Start" button
4. Verify loading bar appears
5. Wait for loading to complete
6. Verify #finish div is now in DOM and visible

**Expected Result:** Loading bar appears; Hello World newly rendered into DOM after completion (was absent before, not just hidden)

---

## TC13 [Negative] - MCPTES-18
**Summary:** Dynamic Loading Ex2 - Hello World absent from DOM before Start is clicked
**AC:** Dynamic Loading Ex2 - Hello World is completely absent from DOM before Start.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_loading/2
2. Without clicking Start, query DOM for #finish

**Expected Result:** #finish div is absent from DOM (not merely hidden) before Start is clicked

---

## TC14 [Positive] - MCPTES-19
**Summary:** Async Loading - Test correctly waits for element instead of failing prematurely
**AC:** When element is expected but page not finished rendering, test waits correctly.

**Steps:**
1. Navigate to https://the-internet.herokuapp.com/dynamic_loading/2
2. Click "Start" without pre-checking DOM
3. Use browser_wait_for to wait for "Hello World!" text
4. Confirm element is visible after wait resolves

**Expected Result:** Test does not fail immediately after click; waits until Hello World! is visible; succeeds on async completion
