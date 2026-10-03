<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->


## Architecture rules
- Loan interest math (monthly compounding by closed months, open month as fraction) lives only in src/lib/loans.ts and is computed client-side from today's date — values are never stored, so they stay current.
- Loan CRUD uses the browser backend client with per-user row security; no server functions needed.
- Signed-in pages live under src/routes/_authenticated/ with a client-side session gate (ssr: false), since the session lives in browser storage.
