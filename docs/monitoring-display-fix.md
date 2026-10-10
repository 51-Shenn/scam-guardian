# Monitoring display investigation — 10 October 2026

User reported monitoring appeared always 100% Normal. Inspection found the three full/empty bars were one-hot policy indicators rather than model probabilities, but this was unclear and Normal appeared while an initial AI score was pending. Merely selecting a request did not deliver it, and the white text button had weak visual emphasis.

Reproduced the original exported app in an isolated hidden Edge browser: all 18 existing browser checks passed, including actual LR review after delivering the coached request with transaction rules quiet, then an unwarned routine payment. This does not establish why the user's particular run remained Normal; the user's active session was not read. No accuracy change or new model effectiveness claim is implied.

Changed shared Android/web presentation:

- Replace full/empty bars with textual policy labels; explicitly state no confidence percentages.
- Show Checking payment before the first AI answer, AI unavailable on assessment failure, and No warning currently for the current unwarned policy. The latter does not certify payment safety.
- Show selected-versus-delivered request context and the actual model ID after successful scoring.
- Give enabled Deliver authored request a dark background and explain why it is disabled or waiting for a click.

Model weights, thresholds, encoder, rule logic, scheduling and label separation remain unchanged. The evaluation label is a ground-truth annotation, not a command to classify a payment as coached.

Regression checks assert the selected/not-delivered state before the click, delivered state afterwards, real AI warning with rules quiet, ordinary payment no-warning state, existing cancellation/timing/FIR arithmetic, and narrow-screen behavior. The exported test-case manual covers the corrective steps; collect the user's own JSON export if the coached case still misses. Browser fixtures are scripted simulations, not independent real-world model validation.

Executed: lint and type checking passed, all78 domain tests passed, Android/web exports passed, and19 hidden Edge browser checks passed with zero captured runtime exceptions. Updated run: `data/processed/pitch-evidence-v1/browser/run-1791644851865`; original reproduction: `run-1791644548381`. Latest tracked browser acceptance/metrics rollups were refreshed by the existing script. The hosted manual was regenerated, and the web-only Vercel build plus6-page10-target checker passed. Screenshots show the delivered coached request and an actual recipient-stage warning with call off. No physical Android or Vercel cloud execution was performed. Existing accuracy findings and quiet-scam misses remain.
