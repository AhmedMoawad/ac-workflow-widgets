# AC Workflow Widgets — CDN bundles

Pre-built widget bundles for the `create-frontend-story` and `acceptance-criteria` skills. Hosting these on a public GitHub repo lets the skills render widgets near-instantly (a ~1.5 KB loader instead of streaming ~25 KB of code per render).

## Files

| File | Global | Used by |
|---|---|---|
| `form.min.js` | `FS_INIT(prefill, selector?)` | Requirements form (create-frontend-story) |
| `review.min.js` | `ACR_INIT(data, selector?)` | Interactive AC review (acceptance-criteria) |
| `diff.min.js` | `ACD_INIT(data, selector?)` | Version diff viewer (acceptance-criteria) |

## Publish (one-time, ~3 minutes)

1. Create a **public** GitHub repository, e.g. `<your-org>/ac-workflow-widgets`. (Public is required for the CDN; the files contain no secrets — generic UI code only.)
2. Add the three `.min.js` files to the repository root and commit.
3. Create a release/tag named `v1`.
4. Verify the CDN URL loads in a browser: `https://cdn.jsdelivr.net/gh/<your-org>/ac-workflow-widgets@v1/form.min.js`
5. Tell Claude the `<owner>/<repo>` — it will patch both skills' CDN base and repackage them for reinstall.

## Updating the widgets later

Never overwrite a published tag (CDNs cache aggressively). Commit changes, tag `v2`, and update the CDN base in the skills to `@v2`. Old conversations keep working against `@v1`.

## Notes

- `prefill.summary` should always be passed to `FS_INIT` (it doubles as the draft-persistence key for new stories).
- All three bundles fail safe: if the CDN script doesn't load, the skills fall back to rendering the widget inline (slower, identical behavior).
