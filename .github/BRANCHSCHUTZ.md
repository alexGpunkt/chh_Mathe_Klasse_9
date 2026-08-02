# Branchschutz für `master`

Dieser Schutz lässt sich **nicht** im Repository ablegen — GitHub verwaltet
ihn außerhalb der Dateien. Er muss einmalig gesetzt werden, sonst kann eine
Fassung nach `master` gelangen, die keine Prüfung bestanden hat. Genau das
ist auf einem Zweig, von dem aus Schülergeräte bedient werden, der
gefährliche Fall.

## Was verlangt werden soll

Ein Merge nach `master` nur, wenn erfolgreich sind:

| Prüfung | Job in `.github/workflows/pruefen.yml` |
|---|---|
| Gesamtprüfung, statische Barrierefreiheit, Performancebudget | `pruefen` |
| Playwright-Smoke-Test (Desktop und Handy) | `browser-smoke` |

Zusätzlich sinnvoll:

- Der Zweig muss vor dem Merge auf dem aktuellen Stand von `master` sein
  (sonst laufen die Prüfungen gegen einen veralteten Stand).
- Kein Force-Push, kein Löschen von `master`.

## Über die Oberfläche

**Settings → Branches → Add branch protection rule**

1. *Branch name pattern:* `master`
2. *Require a pull request before merging* ✓
3. *Require status checks to pass before merging* ✓
   - *Require branches to be up to date before merging* ✓
   - Als erforderlich auswählen: `pruefen`, `browser-smoke`
4. *Do not allow bypassing the above settings* ✓
5. *Allow force pushes* ✗ · *Allow deletions* ✗

> Die Namen erscheinen in der Auswahlliste erst, nachdem der Workflow
> mindestens einmal gelaufen ist.

## Oder in einem Befehl

Erfordert `gh` mit Administrationsrechten am Repository:

```bash
gh api -X PUT repos/:owner/:repo/branches/master/protection \
  -H "Accept: application/vnd.github+json" \
  -F "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=pruefen" \
  -f "required_status_checks[contexts][]=browser-smoke" \
  -F "enforce_admins=true" \
  -F "required_pull_request_reviews[required_approving_review_count]=0" \
  -F "restrictions=null" \
  -F "allow_force_pushes=false" \
  -F "allow_deletions=false"
```

Prüfen, ob es gewirkt hat:

```bash
gh api repos/:owner/:repo/branches/master/protection \
  --jq '.required_status_checks.contexts, .allow_force_pushes.enabled'
```

## Warum nicht null Reviews überall

`required_approving_review_count=0` ist hier bewusst gewählt: Das Projekt
wird von einer Person gepflegt, und ein Review, das niemand geben kann,
blockiert am Ende nur die Veröffentlichung einer Fehlerbehebung. Die
technischen Prüfungen sind der Schutz, nicht die Unterschrift. Arbeiten
später mehrere daran, gehört der Wert auf `1`.
