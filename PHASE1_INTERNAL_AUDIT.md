# Phase 1 Internal Audit — Private Schools

The complete internal audit and delivery status are recorded in `PHASE1_DELIVERY.md`.

Automated regression suite: `node scripts/validate-phase1.js`
Expected terminal marker: `PHASE1_REGRESSION_CONTRACTS_OK`

Critical deployment rule: Supabase function deployment must not run `supabase db push`; schema migrations remain manual-review only.
