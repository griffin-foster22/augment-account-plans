const { useEffect, useMemo, useState } = React;
const h = React.createElement;

const resolveAssetUrl = (assetPath) => new URL(assetPath, document.baseURI).toString();

const DATA_URL = resolveAssetUrl("data/territory_accounts.json");
const SCHEMA_URL = resolveAssetUrl("data/territory_schema.md");
const STAGE_ORDER = [
  "Cold Prospect",
  "Outreach Started",
  "Engaged Prospect",
  "Connected",
  "Meeting Held",
  "Active Opportunity",
  "Closed Customer",
];

const PLAN_SECTIONS = [
  ["Company:", "Company"],
  ["Business Model", "Business Model"],
  ["Key Engineering Systems", "Key Engineering Systems"],
  ["Code Review App Value", "Code Review App Value"],
  ["Unit Test Generation App Value", "Unit Test Generation App Value"],
  ["Build Failure Analyzer App Value", "Build Failure Analyzer App Value"],
  ["Intent App Value", "Intent App Value"],
  ["Problem Statement + Outcome", "Problem Statement + Outcome"],
  ["First Outreach Email", "First Outreach Email"],
  ["LinkedIn Message", "LinkedIn Message"],
];

const TABLE_COLUMNS = [
  ["account_name", "Account"],
  ["stage", "Stage"],
  ["priority", "Priority"],
  ["is_customer", "Customer"],
  ["last_touch_date", "Last touch"],
  ["next_step", "Next step"],
  ["top_opportunity_theme", "Top opportunity theme"],
];

const cx = (...values) => values.filter(Boolean).join(" ");

const formatCellValue = (key, value) => {
  if (key === "is_customer") return value ? "Yes" : "No";
  if (key === "last_touch_date") return value || "No touch logged";
  return value || "—";
};

const buildSearchBlob = (account, plan) =>
  [Object.values(account).join(" "), plan?.raw || ""]
    .join(" ")
    .toLowerCase();

const parsePlanMarkdown = (markdown) => {
  const raw = markdown.replace(/\r/g, "");
  const sections = {};

  PLAN_SECTIONS.forEach(([token, label], index) => {
    const start = raw.indexOf(token);
    if (start === -1) return;

    const contentStart = start + token.length;
    let nextIndex = raw.length;

    for (let cursor = index + 1; cursor < PLAN_SECTIONS.length; cursor += 1) {
      const candidate = raw.indexOf(PLAN_SECTIONS[cursor][0], contentStart);
      if (candidate !== -1) {
        nextIndex = candidate;
        break;
      }
    }

    sections[label] = raw.slice(contentStart, nextIndex).trim();
  });

  return { raw, sections };
};

const metricDefinitions = (accounts) => [
  ["Total Accounts", accounts.length, "default"],
  ["Cold Prospects", accounts.filter((account) => account.stage === "Cold Prospect").length, "cold"],
  ["Engaged Prospects", accounts.filter((account) => account.stage === "Engaged Prospect").length, "warm"],
  ["Meetings Held", accounts.filter((account) => account.stage === "Meeting Held").length, "meeting"],
  ["Customers", accounts.filter((account) => account.is_customer).length, "customer"],
];

function MetricCard({ label, value, tone }) {
  return h(
    "article",
    { className: cx("metric-card", `metric-card--${tone}`) },
    h("span", { className: "metric-card__label" }, label),
    h("strong", { className: "metric-card__value" }, String(value))
  );
}

function FilterBar({ search, onSearchChange, stageFilter, onStageChange, priorityFilter, onPriorityChange, stages, priorities, count, total }) {
  return h(
    "section",
    { className: "panel filter-panel" },
    h(
      "div",
      { className: "filter-panel__controls" },
      h(
        "label",
        { className: "control" },
        h("span", null, "Search"),
        h("input", {
          type: "search",
          value: search,
          placeholder: "Search account, persona, notes, or plan text",
          onChange: (event) => onSearchChange(event.target.value),
        })
      ),
      h(
        "label",
        { className: "control" },
        h("span", null, "Stage"),
        h(
          "select",
          { value: stageFilter, onChange: (event) => onStageChange(event.target.value) },
          h("option", { value: "all" }, "All stages"),
          ...stages.map((stage) => h("option", { key: stage, value: stage }, stage))
        )
      ),
      h(
        "label",
        { className: "control" },
        h("span", null, "Priority"),
        h(
          "select",
          { value: priorityFilter, onChange: (event) => onPriorityChange(event.target.value) },
          h("option", { value: "all" }, "All priorities"),
          ...priorities.map((priority) => h("option", { key: priority, value: priority }, priority))
        )
      )
    ),
    h(
      "div",
      { className: "filter-panel__summary" },
      h("strong", null, `${count} visible`),
      h("span", null, `from ${total} total accounts`)
    )
  );
}

function PipelineBoard({ accounts, selectedAccountName, onSelect }) {
  return h(
    "section",
    { className: "panel pipeline-panel" },
    h(
      "div",
      { className: "section-heading" },
      h("div", null, h("p", { className: "eyebrow" }, "Pipeline"), h("h2", null, "Stage progression")),
      h("p", { className: "section-copy" }, "Grouped by the live dashboard stage order for a quick demo walkthrough.")
    ),
    h(
      "div",
      { className: "pipeline-board" },
      ...STAGE_ORDER.map((stage) => {
        const stageAccounts = accounts.filter((account) => account.stage === stage);
        return h(
          "section",
          { key: stage, className: "pipeline-column" },
          h(
            "div",
            { className: "pipeline-column__header" },
            h("h3", null, stage),
            h("span", { className: "count-pill" }, String(stageAccounts.length))
          ),
          stageAccounts.length
            ? h(
                "div",
                { className: "pipeline-column__list" },
                ...stageAccounts.map((account) =>
                  h(
                    "button",
                    {
                      key: account.account_name,
                      type: "button",
                      className: cx("pipeline-chip", selectedAccountName === account.account_name && "is-selected"),
                      onClick: () => onSelect(account.account_name),
                    },
                    h("strong", null, account.account_name),
                    h("span", null, `${account.priority} • ${account.is_customer ? "Customer" : "Prospect"}`)
                  )
                )
              )
            : h("p", { className: "empty-state" }, "No accounts in stage")
        );
      })
    )
  );
}

function AccountsTable({ accounts, selectedAccountName, onSelect }) {
  return h(
    "section",
    { className: "panel table-panel" },
    h(
      "div",
      { className: "section-heading" },
      h("div", null, h("p", { className: "eyebrow" }, "Accounts"), h("h2", null, "Territory table")),
      h("p", { className: "section-copy" }, "Searchable and filterable view of the core tracking fields required for the demo.")
    ),
    h(
      "div",
      { className: "table-shell" },
      h(
        "table",
        { className: "account-table" },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            ...TABLE_COLUMNS.map(([, label]) => h("th", { key: label, scope: "col" }, label))
          )
        ),
        h(
          "tbody",
          null,
          accounts.length
            ? accounts.map((account) =>
                h(
                  "tr",
                  {
                    key: account.account_name,
                    className: selectedAccountName === account.account_name ? "is-selected" : "",
                    onClick: () => onSelect(account.account_name),
                  },
                  ...TABLE_COLUMNS.map(([key]) =>
                    h(
                      "td",
                      { key },
                      key === "account_name"
                        ? h(
                            "button",
                            { type: "button", className: "row-button", onClick: () => onSelect(account.account_name) },
                            account[key]
                          )
                        : formatCellValue(key, account[key])
                    )
                  )
                )
              )
            : h(
                "tr",
                null,
                h("td", { className: "empty-table", colSpan: TABLE_COLUMNS.length }, "No accounts matched the current filters.")
              )
        )
      )
    )
  );
}

function DetailSection({ title, content, muted }) {
  return h(
    "section",
    { className: "detail-section" },
    h("h4", null, title),
    h("p", { className: muted ? "muted-copy" : null }, content || "—")
  );
}

function DetailPanel({ account, plan, planLoading }) {
  if (!account) {
    return h(
      "aside",
      { className: "panel detail-panel" },
      h("p", { className: "empty-state detail-empty" }, "Select an account to inspect its plan, outreach messaging, and notes.")
    );
  }

  const sections = plan?.sections || {};
  const fullPlanSections = PLAN_SECTIONS.filter(([, label]) => !["First Outreach Email", "LinkedIn Message"].includes(label));

  return h(
    "aside",
    { className: "panel detail-panel" },
    h(
      "div",
      { className: "detail-panel__hero" },
      h(
        "div",
        null,
        h("p", { className: "eyebrow" }, "Account detail"),
        h("h2", null, account.account_name),
        h("p", { className: "section-copy" }, account.top_opportunity_theme)
      ),
      h(
        "div",
        { className: "detail-pills" },
        h("span", { className: "pill" }, account.stage),
        h("span", { className: "pill" }, account.priority),
        h("span", { className: cx("pill", account.is_customer && "pill--customer") }, account.is_customer ? "Customer" : "Prospect")
      )
    ),
    h(
      "div",
      { className: "detail-grid" },
      h(DetailSection, { title: "Target persona", content: account.target_persona, muted: true }),
      h(DetailSection, { title: "Last touch date", content: account.last_touch_date || "No touch logged", muted: true }),
      h(DetailSection, { title: "Outreach status", content: account.outreach_status, muted: true }),
      h(DetailSection, { title: "Next step", content: account.next_step })
    ),
    h(
      "section",
      { className: "detail-section detail-section--spotlight" },
      h("h3", null, "Notes summary"),
      h("p", null, account.notes_summary)
    ),
    h(
      "section",
      { className: "detail-section" },
      h(
        "div",
        { className: "detail-section__header" },
        h("h3", null, "Outreach messaging"),
        h("a", { href: resolveAssetUrl(account.account_plan_file) }, "Open markdown plan")
      ),
      planLoading && !plan ? h("p", { className: "muted-copy" }, "Loading account plan…") : null,
      h(DetailSection, { title: "First Outreach Email", content: sections["First Outreach Email"] || "Not available in parsed plan yet." }),
      h(DetailSection, { title: "LinkedIn Message", content: sections["LinkedIn Message"] || "Not available in parsed plan yet." })
    ),
    h(
      "section",
      { className: "detail-section" },
      h("h3", null, "Full account plan data"),
      ...fullPlanSections.map(([, label]) => h(DetailSection, { key: label, title: label, content: sections[label] || (planLoading ? "Loading account plan…" : "Not available."), muted: label === "Company" }))
    ),
    plan?.raw
      ? h(
          "details",
          { className: "raw-plan" },
          h("summary", null, "View raw markdown"),
          h("pre", null, plan.raw)
        )
      : null
  );
}

function App() {
  const [accounts, setAccounts] = useState([]);
  const [plans, setPlans] = useState({});
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedAccountName, setSelectedAccountName] = useState(null);
  const [loadingState, setLoadingState] = useState({ loading: true, error: "", planLoading: true });

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const response = await fetch(DATA_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const territoryAccounts = await response.json();
        if (cancelled) return;

        setAccounts(territoryAccounts);
        setSelectedAccountName(territoryAccounts[0]?.account_name || null);
        setLoadingState({ loading: false, error: "", planLoading: true });

        const entries = await Promise.all(
          territoryAccounts.map(async (account) => {
            try {
              const planResponse = await fetch(resolveAssetUrl(account.account_plan_file), { cache: "no-store" });
              if (!planResponse.ok) throw new Error(`HTTP ${planResponse.status}`);
              const markdown = await planResponse.text();
              return [account.account_name, parsePlanMarkdown(markdown)];
            } catch (error) {
              return [account.account_name, { raw: "", sections: {}, error: error.message }];
            }
          })
        );

        if (cancelled) return;
        setPlans(Object.fromEntries(entries));
        setLoadingState((current) => ({ ...current, planLoading: false }));
      } catch (error) {
        if (cancelled) return;
        setLoadingState({
          loading: false,
          planLoading: false,
          error: `Could not load ${DATA_URL}. Publish index.html, app.js, styles.css, data/, and outputs/ together for static hosting. For local review, serve the repo over HTTP (for example: python3 -m http.server 5173). ${error.message}`,
        });
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const stageOptions = useMemo(
    () => STAGE_ORDER.filter((stage) => accounts.some((account) => account.stage === stage)),
    [accounts]
  );

  const priorityOptions = useMemo(
    () => [...new Set(accounts.map((account) => account.priority))].sort(),
    [accounts]
  );

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesSearch = !query || buildSearchBlob(account, plans[account.account_name]).includes(query);
      const matchesStage = stageFilter === "all" || account.stage === stageFilter;
      const matchesPriority = priorityFilter === "all" || account.priority === priorityFilter;
      return matchesSearch && matchesStage && matchesPriority;
    });
  }, [accounts, plans, priorityFilter, search, stageFilter]);

  useEffect(() => {
    if (!filteredAccounts.length) return;
    if (!filteredAccounts.some((account) => account.account_name === selectedAccountName)) {
      setSelectedAccountName(filteredAccounts[0].account_name);
    }
  }, [filteredAccounts, selectedAccountName]);

  const selectedAccount = filteredAccounts.find((account) => account.account_name === selectedAccountName)
    || accounts.find((account) => account.account_name === selectedAccountName)
    || filteredAccounts[0]
    || null;

  return h(
    "main",
    { className: "app-shell" },
    h(
      "header",
      { className: "hero panel" },
      h(
        "div",
        { className: "hero__copy" },
        h("p", { className: "eyebrow" }, "React territory demo"),
        h("h1", null, "Territory dashboard"),
        h(
          "p",
          { className: "hero__text" },
          "Frontend-only React experience backed by ",
          h("code", null, "data/territory_accounts.json"),
          " with local markdown plans layered into the account detail view."
        )
      ),
      h(
        "div",
        { className: "hero__actions" },
        h("a", { href: DATA_URL }, "View JSON"),
        h("a", { href: SCHEMA_URL }, "View schema"),
        h("span", { className: "hero-badge" }, "No install React")
      )
    ),
    h(
      "section",
      { className: "metrics-grid" },
      ...metricDefinitions(accounts).map(([label, value, tone]) => h(MetricCard, { key: label, label, value, tone }))
    ),
    h(FilterBar, {
      search,
      onSearchChange: setSearch,
      stageFilter,
      onStageChange: setStageFilter,
      priorityFilter,
      onPriorityChange: setPriorityFilter,
      stages: stageOptions,
      priorities: priorityOptions,
      count: filteredAccounts.length,
      total: accounts.length,
    }),
    loadingState.error
      ? h("section", { className: "panel status-banner status-banner--error" }, loadingState.error)
      : h(
          "section",
          { className: "panel status-banner" },
          loadingState.loading
            ? "Loading territory data…"
            : `Showing ${filteredAccounts.length} account${filteredAccounts.length === 1 ? "" : "s"} from the live territory dataset.`
        ),
    h(PipelineBoard, {
      accounts: filteredAccounts,
      selectedAccountName,
      onSelect: setSelectedAccountName,
    }),
    h(
      "section",
      { className: "workspace-grid" },
      h(AccountsTable, {
        accounts: filteredAccounts,
        selectedAccountName,
        onSelect: setSelectedAccountName,
      }),
      h(DetailPanel, {
        account: selectedAccount,
        plan: selectedAccount ? plans[selectedAccount.account_name] : null,
        planLoading: loadingState.planLoading,
      })
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));