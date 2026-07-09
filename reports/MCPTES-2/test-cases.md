# Test Cases — MCPTES-2 (APIUserstory)

Target: `https://restful-booker.herokuapp.com` (Restful-Booker API)
Jira story: [MCPTES-2](https://sasiapitest.atlassian.net/browse/MCPTES-2)

**Source of these test cases**: discovered via `jira_get_issue` on MCPTES-2 with `fields=issuelinks`,
filtered to linked issues of `issuetype = Test` connected via the `Test` link type (outward "tests" /
inward "is tested by", link type id `10038`). No new Xray Test issues were created in this run — all
6 already existed from an earlier pass. See report.md for a note on the description-format check this
new workflow requires.

## MCPTES-27 — API: Create booking with valid payload returns 200 and matching bookingid
- **Type**: Positive (from description's `**Type**: Positive` line)
- **Request**: `POST /booking` with `{firstname, lastname, totalprice, depositpaid, bookingdates: {checkin, checkout}, additionalneeds}`
- **Expected**: HTTP 200, response contains a `bookingid` and `booking` object matching the submitted fields exactly.

## MCPTES-28 — API: Update booking with valid auth token returns 200 and updated values
- **Type**: Positive (from description's `**Type**: Positive` line)
- **Request**:
  1. `POST /auth` with `{"username":"admin","password":"password123"}` → returns `token`.
  2. `PUT /booking/{id}` with updated fields and header `Cookie: token=<token>`.
- **Expected**: HTTP 200, response body reflects the updated field values; follow-up `GET /booking/{id}` confirms persistence.

## MCPTES-29 — API: Get booking IDs with no filters returns 200 and full list
- **Type**: Positive (from description's `**Type**: Positive` line)
- **Request**: `GET /booking`
- **Expected**: HTTP 200, JSON array of `{bookingid: N}` objects.

## MCPTES-30 — API: Get booking IDs with firstname/lastname filters returns only matching IDs
- **Type**: Positive (from description's `**Type**: Positive` line)
- **Request**: `GET /booking?firstname=John&lastname=Doe`
- **Expected**: HTTP 200, only booking IDs matching the filter are returned (a materially smaller/matching subset of the full list).

## MCPTES-31 — API: Update booking without valid auth token returns 403 Forbidden
- **Type**: Negative (from description's `**Type**: Negative` line)
- **Request**: `PUT /booking/{id}` with updated fields, no `Cookie`/`Authorization` header.
- **Expected**: HTTP 403 Forbidden.

## MCPTES-32 — API: Get non-existent bookingid returns 404 Not Found
- **Type**: Negative (from description's `**Type**: Negative` line)
- **Request**: `GET /booking/999999999`
- **Expected**: HTTP 404 Not Found.
