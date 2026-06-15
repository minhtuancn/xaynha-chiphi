# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Security >> XSS prevention in search
- Location: tests/e2e.spec.ts:218:7

# Error details

```
Error: page.waitForURL: Target page, context or browser has been closed
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

```
Error: browserContext.close: Target page, context or browser has been closed
```