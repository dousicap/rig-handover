---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Forme des issues (convenue le 2026-11-21, ne plus la redemander)

Chaque issue porte le label `plan:<nom du plan>` et ce corps, dans cet ordre :

1. `Source : plan.md § <section>`
2. `## Portée` : puces, fichiers et règles (ADR citées).
3. `## Fait quand` : la ligne « Done when » du plan, vérifiable.
4. `## Bloqué par` : numéros réels (`#n`), ou `—`.
5. `## Worker` : modèle suggéré et pourquoi, puis « Fermer avec le commentaire de AGENTS.md ».

Une étape qui attend quelqu'un d'autre (relecteur, client) est sa propre issue. Son « Fait quand »
est la confirmation de cette personne, pas l'envoi. Elle reste ouverte jusque-là et bloque le
nettoyage qui suit.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Ask the human what every issue here must carry (fields, labels, wording), unless it is
   already written down in this session or in the repo.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
