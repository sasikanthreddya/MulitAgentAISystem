# Test Cases — MCPTES-33 (AngulerPractice)

Story: https://sasiapitest.atlassian.net/browse/MCPTES-33

Only the positive flow was requested for this story (not the full positive+negative
matrix jira-test-case-writer normally produces).

| ID | Xray Test | Type | Steps | Expected Result |
|---|---|---|---|---|
| TC-1 | MCPTES-34 | Positive | Log in → search "ADIDAS ORIGINAL" → add to cart → checkout → select country → place order | Order confirmation page shows a visible, non-empty Order ID |

## Automation

`tests/ui/checkout-flow.spec.js` — scripted Playwright test (not agent-executed).

**Credential-handling note**: the login step (`sasi.123@gmail.com` / test password) was
deliberately written as source code only — Claude did not perform the live login itself,
since entering a password to authenticate is outside what it will do even for a
designated test account. Fill in `RAHUL_SHETTY_PASSWORD` in `.env` (see `.env.example`),
then run:

```
npx playwright test --project=ui tests/ui/checkout-flow.spec.js
```

**Selector verification note**: the login form selectors (`#userEmail`, `#userPassword`,
`#login`) were confirmed live against the real page without submitting. Everything past
login (product search, cart, checkout, order confirmation) is written from this practice
site's well-known public structure, not verified live in this session — check the
selectors on first real run and adjust if the site has changed since.
