# SwimSetter — Swim Set Output Formats Reference

This document describes every set format, step kind, equipment flag, timing variant, and display pattern that the SwimSetter plan generator can produce. It is intended as a reference for agents consuming or generating swim plan JSON.

---

## Plan Structure

A plan is a JSON object with three sections. All distances are integers in metres and **must be exact multiples of 50**.

```json
{
  "plan_id": "uuid",
  "created_at": "ISO-8601 datetime",
  "duration_minutes": 30,
  "estimated_distance_m": 1050,
  "sections": {
    "warm_up":   { "title": "Warm-Up",  "section_distance_m": 200, "steps": [ ... ] },
    "main_set":  { "title": "Main Set", "section_distance_m": 750, "steps": [ ... ] },
    "cool_down": { "title": "Cool-Down","section_distance_m": 100, "steps": [ ... ] }
  }
}
```

**Invariants:**
- `warm_up.section_distance_m + main_set.section_distance_m + cool_down.section_distance_m == estimated_distance_m`
- Each section's `section_distance_m` must equal the sum of its step distances.
- `warm_up` and `cool_down` contain at most 2 steps each.
- All warm_up and cool_down steps use `effort: "easy"`.

---

## Step Schema

Every step has these required fields:

| Field | Type | Notes |
|---|---|---|
| `step_id` | string | e.g. `"wu-1"`, `"main-2"`, `"cd-1"` |
| `kind` | string | See step kinds below |
| `reps` | integer | Must be > 0 |
| `distance_per_rep_m` | integer | Must be multiple of 50, >= 50. Use 50 as placeholder for pyramid kinds. |
| `stroke` | string | `freestyle`, `backstroke`, `breaststroke`, `butterfly`, `mixed`, `choice` |
| `effort` | string | `easy`, `medium`, `hard` |
| `description` | string | One concise coaching cue sentence |
| `rest_seconds` | integer \| null | Rest between reps in seconds; null if using sendoff |

Optional fields:

| Field | Type | Applies to |
|---|---|---|
| `sendoff_seconds` | integer \| null | Clock-based intervals — total window per rep (swim + rest) |
| `pyramid_sequence_m` | integer[] | Required for `pyramid`, `descending`, `ascending` kinds |
| `rest_sequence_s` | integer[] | Per-rep rest durations for pyramid kinds (alternative to `rest_seconds`) |
| `sendoff_sequence_s` | integer[] | Per-rep sendoff durations for pyramid kinds (alternative to `sendoff_seconds`) |
| `fins` | boolean | Step is done wearing swim fins |
| `pull` | boolean | Step uses a pull buoy (no kick) |
| `paddles` | boolean | Step uses hand paddles |
| `hypoxic` | boolean | Restricted breathing pattern; main_set only |
| `underwater` | boolean | Full breath-hold rep; main_set only |
| `broken_pause_s` | integer | Required for `broken` kind; pause duration in seconds |
| `target_time_s` | integer | Optional for `time_trial`; benchmark in seconds |
| `split_instruction` | string | Required for `negative_split` kind |

**Timing rules:**
- Use `rest_seconds` **or** `sendoff_seconds` — never both on the same step.
- For pyramid kinds, use `rest_sequence_s` **or** `sendoff_sequence_s` instead of scalar timing, when rest/sendoff varies per rep. Set the scalar field to `null`.
- `rest_sequence_s` and `sendoff_sequence_s` are mutually exclusive.

---

## Step Kinds

### `continuous`

A single unbroken swim with no rest. Always `reps: 1`.

**Schema:**
```json
{ "kind": "continuous", "reps": 1, "distance_per_rep_m": 400, "rest_seconds": null }
```

**Display:** `400m freestyle easy`

---

### `intervals`

Repeated fixed-distance efforts with a defined rest or sendoff.

**Schema (rest-based):**
```json
{ "kind": "intervals", "reps": 8, "distance_per_rep_m": 50, "rest_seconds": 20 }
```
**Display:** `8 x 50m freestyle hard @ 20s rest`

**Schema (sendoff-based — clock intervals):**
```json
{ "kind": "intervals", "reps": 5, "distance_per_rep_m": 100, "sendoff_seconds": 120, "rest_seconds": null }
```
**Display:** `5 x 100m freestyle hard @ 2:00`

*Note: `reps: 1` must use `kind: "continuous"`, not `kind: "intervals"`.*

---

### `pyramid`

A set where distances go up then come back down (e.g. 100–150–200–150–100). `reps` must equal `pyramid_sequence_m.length`.

**Schema:**
```json
{
  "kind": "pyramid",
  "reps": 5,
  "distance_per_rep_m": 50,
  "pyramid_sequence_m": [100, 150, 200, 150, 100],
  "rest_sequence_s": [10, 15, 20, 15, 10],
  "rest_seconds": null
}
```
**Display:** `pyramid [100-150-200-150-100]m freestyle medium`

With per-rep timing: `pyramid [100-150-200-150-100]m freestyle medium @ [10-15-20-15-10]s rest`

The step's distance contribution = sum of `pyramid_sequence_m` = 700m.

---

### `descending`

Distances step down across reps (e.g. 200–150–100–50). Same schema shape as `pyramid`.

**Schema:**
```json
{
  "kind": "descending",
  "reps": 4,
  "distance_per_rep_m": 50,
  "pyramid_sequence_m": [200, 150, 100, 50],
  "rest_seconds": 15
}
```
**Display:** `descending [200-150-100-50]m freestyle hard @ 15s rest`

---

### `ascending`

Distances step up across reps (e.g. 50–100–150–200). Same schema shape as `pyramid`.

**Schema:**
```json
{
  "kind": "ascending",
  "reps": 4,
  "distance_per_rep_m": 50,
  "pyramid_sequence_m": [50, 100, 150, 200],
  "rest_seconds": 15
}
```
**Display:** `ascending [50-100-150-200]m freestyle medium @ 15s rest`

---

### `build`

A single rep where effort increases throughout the rep. Always `reps: 1`.

**Schema:**
```json
{ "kind": "build", "reps": 1, "distance_per_rep_m": 200, "rest_seconds": 30 }
```
**Display:** `1 x 200m freestyle medium @ 30s rest`

*(Display falls through to the generic `reps x distance` format.)*

---

### `negative_split`

A single rep targeting a faster second half. Requires `split_instruction`. Always `reps: 1`.

**Schema:**
```json
{
  "kind": "negative_split",
  "reps": 1,
  "distance_per_rep_m": 400,
  "split_instruction": "swim the first 200m at medium effort, negative split to hard for the second 200m",
  "rest_seconds": 45
}
```
**Display:** `1 x 400m freestyle medium @ 45s rest`

---

### `broken`

A swim paused at the halfway point of each rep, then continued. Requires `broken_pause_s >= 5` (pause duration in seconds). `reps >= 1`.

**Schema:**
```json
{
  "kind": "broken",
  "reps": 1,
  "distance_per_rep_m": 400,
  "broken_pause_s": 15,
  "rest_seconds": null
}
```
**Display (single rep):** `400m broken (15s pause) freestyle hard`

**Schema (multiple reps):**
```json
{
  "kind": "broken",
  "reps": 3,
  "distance_per_rep_m": 200,
  "broken_pause_s": 10,
  "rest_seconds": 30
}
```
**Display (multiple reps):** `3 x 200m broken (10s pause) freestyle hard @ 30s rest`

*A broken swim lets swimmers target a faster overall time than they could hold continuously. The pause is at the wall at the halfway point. The description should instruct the swimmer to check their split time at the pause.*

---

### `fartlek`

A single continuous swim with repeating effort surges throughout. Always `reps: 1`. The surge pattern is described in the step description.

**Schema:**
```json
{
  "kind": "fartlek",
  "reps": 1,
  "distance_per_rep_m": 600,
  "rest_seconds": null
}
```
**Display:** `600m fartlek freestyle medium`

*The description must explain the surge pattern, e.g. "sprint hard for one length, easy for three lengths, repeat throughout." Typically 400–800m total.*

---

### `time_trial`

A single all-out effort over a fixed distance. Always `reps: 1`. Do not set `rest_seconds` or `sendoff_seconds`. `target_time_s` is optional.

**Schema (with target):**
```json
{
  "kind": "time_trial",
  "reps": 1,
  "distance_per_rep_m": 400,
  "rest_seconds": null,
  "target_time_s": 330
}
```
**Display:** `400m time trial freestyle (target 5:30)`

**Schema (no target):**
```json
{
  "kind": "time_trial",
  "reps": 1,
  "distance_per_rep_m": 200,
  "rest_seconds": null
}
```
**Display:** `200m time trial freestyle`

*Typical distances: 100–400m. The description should instruct the swimmer to go all-out and note their time.*

---

## Golf Set

Golf is not a separate `kind` — it uses `kind: "intervals"`. The `golf` requested tag instructs the LLM to structure the main set as a GOLF scoring game.

**GOLF scoring:** For each 50m rep, score = stroke count + time in seconds for that length. Aim to lower your score on each rep. The mechanic forces a balance between speed and efficiency.

**Typical schema:**
```json
{
  "kind": "intervals",
  "reps": 8,
  "distance_per_rep_m": 50,
  "rest_seconds": 25
}
```
**Display:** `8 x 50m freestyle medium @ 25s rest`

*The description carries the GOLF scoring explanation.*

---

## Timing Display Formats

| Timing field(s) | Display suffix |
|---|---|
| `rest_seconds: 20` | `@ 20s rest` |
| `sendoff_seconds: 120` | `@ 2:00` |
| `rest_sequence_s: [10, 15, 20]` | `@ [10-15-20]s rest` |
| `sendoff_sequence_s: [90, 120, 150]` | `@ [1:30-2:00-2:30]` |
| `rest_seconds: null`, no sendoff | *(no timing suffix)* |

---

## Equipment Flags

Equipment flags are boolean fields on steps. They appear as badges in the display string.

### `fins: true`

Step done wearing swim fins. Can appear in any section. Only permitted when `"fins"` is in `requested_tags`.

**Display badge:** `[fins]`

**Example display:** `6 x 50m freestyle hard @ 30s rest [fins]`

**Formats:** kick with fins, sprint with fins, endurance swim with fins, or underwater with fins.

---

### `pull: true`

Step done with a pull buoy between the thighs (no kick). Only permitted when `"pull"` is in `requested_tags`.

**Display badge:** `[pull]`

**Example display:** `4 x 100m freestyle medium @ 20s rest [pull]`

---

### `paddles: true`

Step done wearing hand paddles (increases resistance, builds upper-body power). Can be combined with `pull: true`. Only permitted when `"paddles"` is in `requested_tags`.

**Display badge:** `[paddles]`

**Example display:** `4 x 100m freestyle hard @ 25s rest [pull, paddles]`

---

### `underwater: true`

Full breath-hold rep — swimmer holds breath for the entire rep distance. Main_set only. Must use `rest_seconds >= 30`, never `sendoff_seconds`. Typically 50m reps.

**Display badge:** `[underwater]`

**Example display:** `4 x 50m freestyle hard @ 40s rest [underwater]`

*Note: to cue an "underwater finish" (last 10m only), describe it in the step's `description` text instead — do not set `underwater: true`.*

---

### `hypoxic: true`

Restricted breathing step — swimmer breathes every 5, 7, or 9 strokes or holds breath for a full length. Main_set only. Must have `rest_seconds >= 20`.

*`hypoxic: true` does not add a display badge — it is reflected in the step description (e.g. "breathe every 7 strokes").*

---

## Badge Display Order

When multiple equipment flags are set, badges appear in this order: `[pull, paddles, fins, underwater]`.

**Example:** `4 x 100m freestyle hard @ 25s rest [pull, paddles]`

---

## Complete Display String Format

```
<base> <timing> <badges> - <description>
```

- `<base>` — distance and stroke pattern (varies by kind, see above)
- `<timing>` — rest or sendoff suffix (omitted if no timing)
- `<badges>` — equipment badges, e.g. `[pull, fins]` (omitted if none)
- ` - <description>` — coaching cue (omitted if description is empty)

**Full example:**
```
4 x 100m freestyle hard @ 2:00 [pull, paddles] - Drive high elbows through the catch and hold your power all the way to the wall.
```

---

## Request Tags Reference

The following tags can be requested by the user. Each steers the generated plan's structure or content.

| Tag | Effect |
|---|---|
| `technique` | Overrides main_set to a drill circuit (3–5 named drills) |
| `speed` | Short fast repeats, sendoff-based intervals, 6–12 × 50–100m |
| `endurance` | Longer steady repeats or continuous swims, short rest (10–20s) |
| `recovery` | All easy, continuous preferred, generous rest, low volume |
| `fun` | Multiple step formats, at least one structurally unusual step |
| `steady` | Aerobic threshold pace, consistent rest, no mixed pacing |
| `freestyle` | Freestyle as primary stroke in main_set |
| `mixed` | Rotate at least two strokes across main_set steps |
| `kick` | Dedicated kick step (no arm pull) as first main_set step |
| `fins` | At least one step with `fins: true` |
| `pull` | At least one step with `pull: true` |
| `paddles` | At least one step with `paddles: true` |
| `golf` | Main set structured as a GOLF scoring game (intervals, 6–10 × 50m) |
| `broken` | At least one `broken` kind step |
| `fartlek` | At least one `fartlek` kind step |
| `time_trial` | At least one `time_trial` kind step |

---

## Swim Level Constraints

| Level | Effect |
|---|---|
| `beginner` | Continuous and simple intervals only. No pyramids, descending/ascending sets. Rest: 30–45s. Short reps (50–100m). |
| `intermediate` | Standard intervals, continuous, simple pyramids. Rest: 15–30s. Moderate complexity. |
| `advanced` | All formats available. Pyramids, descending/ascending, drill circuits, negative splits. Rest: 10–20s for hard efforts. |

---

## Effort Guidance

| Effort | Volume (m/min) | Warm-Up | Main Set | Cool-Down |
|---|---|---|---|---|
| `easy` | 25–35 | 1–2 easy continuous (100–200m each) | 100–200m repeats, 15–30s rest | Easy choice stroke |
| `medium` | 30–40 | Easy build + optional 4×50m activation | 100–200m repeats, 15–30s rest | Easy relaxed swim |
| `hard` | 35–45 | Easy build + 4–6×50m activation piece | 50–100m repeats, 20–45s rest, quality over volume | Min 100m easy continuous |

---

## Distance Calculation Rules

- All `distance_per_rep_m` and `pyramid_sequence_m` values must be multiples of 50, minimum 50.
- For `pyramid`/`descending`/`ascending` steps: set `distance_per_rep_m: 50` as a placeholder. Step distance = sum of `pyramid_sequence_m`.
- For all other steps: step distance = `reps × distance_per_rep_m`.
- `section_distance_m` = sum of step distances in that section.
- `estimated_distance_m` = sum of all three `section_distance_m` values.
