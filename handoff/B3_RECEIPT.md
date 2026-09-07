# B3 RECEIPT — RitmoGrid / BUILD_MODE

STATUS = T4_B3
CANDIDATE = BUILD_MODE
T0/T1/T2/T3/T4/TOTAL_DURATION = T1 empty state ~8m / T2 core loop ~18m / T3 frontier ~28m / T4 cierre + polish + handoff / TOTAL ~40m + verification stamp
REFERENCE_RESEARCHED = YES (habitkit.app, App Store CL/US, Play, TapSmart, ProdApps, APKMirror changelog)
CORE_FEATURES_COMPLETE = YES
DIFFERENTIATOR_HYPOTHESIS = Cierre de Ritmo: ritual de 10s para cerrar el día entero, puntaje 0–100 e hilo de días cerrados. Dolor: hábitos hechos pero no marcados; la grilla se ve rota. Encaja encima del un-toque, no lo reemplaza.
DIFFERENTIATOR_IMPLEMENTED = YES
DIFFERENTIATOR_USER_VALUE = Cierra pendientes en una pantalla, escribe intención de mañana, muestra hilo. Verificado: 33% con 2 pendientes → 100% y hilo 1 tras cerrar; banner “Ritmo cerrado”.
DIFFERENTIATOR_VERIFICATION = UI: banner, hoja, skip/complete, nota, intención, score, hilo. Persistido en localStorage.cierres.
EXPANSIONS_COMPLETED = quit habits, day notes, quantity/ring, 3 overview modes, share canvas, theme, week start, archive, export/import v1, in-app reminders badge, reorder up/down, stats chart
EXPANSIONS_SKIPPED_AND_WHY = home_screen_widgets (nativo); reminders push (web); press-and-hold drag (PARTIAL, controles subir/bajar)
WORKING_REPO/BRANCH/FINAL_COMMIT = NanoCarriez/ritmogrid-b3-buildmode-20260907 / b3-buildmode / (reviewer resolves HEAD)
PUBLIC_EVALUATION_URL = null
PUBLIC_ROUTE_TYPE = CANDIDATE_NATIVE_PREVIEW
NETLIFY_PRODUCTION_DEPLOYS = 0
PERSISTENCE_ROUTE = localStorage key ritmogrid.v1 (zustand persist)
REFERENCE_FEATURES_IDENTIFIED_MATERIAL = 24
REFERENCE_FEATURES_REPLICATED = 21
REFERENCE_FEATURES_PARTIAL = 2
REFERENCE_FEATURES_NOT_REPLICATED = 1
REPLICATION_FRONTIER = handoff/REPLICATION_FRONTIER.json
REPLICATION_COVERAGE_SUMMARY = 21/24 material replicated, 2 partial (reorder drag, native reminders), 1 not (widgets)
MANDATORY_ACCEPTANCE = 24/24
DETERMINISTIC_STREAK_TESTS = PASS (A06 current=3 best=3; A07 6/6)
IMPORT_EXPORT_TESTS = PASS (roundtrip + malformed + orphan rejected, no corruption)
MOBILE_390x844 = PASS (scrollWidth=clientWidth=390, no horizontal overflow)
PRIOR_APP_RUNTIME_CONTAMINATION = NONE
INITIAL_ROUTE_PLAN = TanStack Start + React + Zustand + localStorage, no backend
FINAL_ROUTE_USED = same
ROUTE_DEVIATIONS = none
TOOLS_CONSIDERED = Netlify production, Neon/auth, competing builders
TOOLS_USED = public web research, GitHub, Playwright smoke, agent-browser, tsx tests
TOOL_HOPS = 1 (GitHub for deterministic handoff)
REAL_DEFECTS = splash stuck on persist.rehydrate (timeout + empty-storage fast path); count one-tap filled target then switched to increment; calendar blocked days before created (opened for backfill); calendar count tap incremented instead of completing the day (toggleCompletion); ArchiveView infinite loop from unstable zustand selector (fixed)
DIAGNOSTIC_PROBES = 4 (hydration screenshot, localStorage createdAt, archive crash body text, calendar streak after tap)
REPAIR_LOOPS = 4
UNNECESSARY_HOPS = 0
NANO_ROUTINE_INTERVENTIONS = 0
AUTH_GATES = 0
NANO_FILE_TRANSPORTS = 0
NANO_HANDOFF_TRANSPORT = 0
READY_FOR_REVIEW_MARKER = READY_FOR_REVIEW
RECEIPT_REPO_PATH = handoff/B3_RECEIPT.md
KNOWN_LIMITATIONS = no native widgets; no native push; reorder is up/down not drag; share PNG uses canvas (Web Share if available)
DETERMINISTIC_HANDOFF_REPO = NanoCarriez/ritmogrid-b3-buildmode-20260907
READY_FOR_REVIEW_PATH = handoff/READY_FOR_REVIEW.json
REFERENCE_FEATURE_MAP_PATH = handoff/REFERENCE_FEATURE_MAP.json
OPERATIONAL_HANDOFF = Reviewer: open repo NanoCarriez/ritmogrid-b3-buildmode-20260907 branch b3-buildmode. Read handoff/READY_FOR_REVIEW.json and this receipt. Resolve HEAD commit at review time. Native preview is the Build Mode live preview (port contract of the workspace). No Netlify production deploy was made.

## Completion-rate definition
NUMERATOR = days in [createdDate .. asOfDate] that meet the habit (build: value >= dailyTarget; quit: no slip).
DENOMINATOR = calendar days in that inclusive range.
If denominator is 0, rate is 0. Never NaN/Infinity.

## Streak fixture
D1=yes, D2=yes, D3=no, D4=yes, D5=yes, D6=yes → current 3, best 3 on D6.
Edit D3 to yes → current 6, best 6.
