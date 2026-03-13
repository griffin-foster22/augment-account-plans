# Territory Accounts Schema

`data/territory_accounts.json` is a top-level JSON array of 8 territory account records consumed by the demo dashboard. Keep the field names exactly as shown below.

Dashboard conventions:
- `stage` follows this ordered pipeline: `Cold Prospect` → `Outreach Started` → `Engaged Prospect` → `Connected` → `Meeting Held` → `Active Opportunity` → `Closed Customer`.
- `is_customer` should be `true` only when `stage` is `Closed Customer`; all earlier stages stay `false`.
- `last_touch_date`, `next_step`, and `outreach_status` are lightweight dashboard tracking fields. They may use plausible placeholder/demo values when CRM history is unavailable, but they should stay internally consistent with the current `stage`.
- A blank `last_touch_date` means no outreach or account activity has been logged yet.

| Field | Meaning | Expected type / format | Dashboard / placeholder convention |
| --- | --- | --- | --- |
| `account_name` | Human-readable company display name. | string; e.g. `"Cisco"` or `"CrowdStrike"` | Stable account identifier shown in the dashboard. |
| `stage` | Current territory / pipeline stage. | string; one of the ordered stage labels above | Drives pipeline grouping, stage filters, and summary metrics. |
| `is_customer` | Whether the account is already a customer. | boolean | Align with `stage`; only `Closed Customer` should be `true`. |
| `priority` | Internal territory priority label. | string; tier-style label such as `"Tier 1"` or `"Tier 2"` | Used for dashboard filtering; may be a demo prioritization rather than CRM scoring. |
| `business_model` | Short summary of how the company makes money. | string; single-paragraph summary | Sourced from the account plan, not a tracking placeholder. |
| `engineering_systems` | Short summary of the company’s key engineering systems. | string; single-paragraph summary | Sourced from the account plan, not a tracking placeholder. |
| `top_opportunity_theme` | Primary Augment value angle for the account. | string; short sentence/summary | Sourced from the account plan and surfaced in table/detail views. |
| `target_persona` | Primary buyer / engineering leader to target. | string; role label such as `VP Engineering` | Sourced from the account plan. |
| `last_touch_date` | Most recent outreach or account activity date. | string; `YYYY-MM-DD`, or `""` if untouched | Placeholder/demo dates are allowed if they match the account’s stage story. |
| `next_step` | Recommended next action for the account. | string | May be a plausible placeholder action when no real rep-owned next step exists yet. |
| `notes_summary` | Short dashboard-ready notes summary for the account. | string; short sentence/summary | Sourced from the account plan and/or concise territory notes. |
| `outreach_status` | Current outbound status label. | string | Demo-friendly tracking label; keep it consistent with `stage` and `next_step`. |
| `account_plan_file` | Repo-relative path to the source account plan markdown file. | string under `outputs/`; e.g. `outputs/cisco.md` | Links the dashboard record back to the underlying plan. |

All fields except `is_customer` are serialized as JSON strings.