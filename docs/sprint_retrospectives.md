# Sprint Retrospectives

## Sprint 1 (Nov 2 – Nov 8)
### What Went Well
- Repository structure and tooling (FastAPI, PyTorch, React scaffold) set up quickly.
- Five curated datasets plus two MNIST templates delivered on schedule.
- Clear API contracts documented early, reducing integration friction later.

### What Could Be Improved
- Underestimated time for dataset hyperparameter tuning; rushed final day.
- Some PRs merged without sufficient review—introduced minor bugs caught in Sprint 2.

### Action Items
- Add PR checklist requiring at least one teammate approval.
- Allocate buffer day before sprint end for polish and docs.

---

## Sprint 2 (Nov 9 – Nov 15)
### What Went Well
- Dynamic `DynamicMLPModel` integrated smoothly with training engine.
- Training API endpoints (`POST /train`, `GET /status`) shipped with >60% test coverage.
- Polling optimization (`since_epoch`) keeps payloads small during real-time updates.

### What Could Be Improved
- Late discovery of Pydantic v1→v2 deprecation warnings; needed mid-sprint refactor.
- Limited cross-team pairing slowed knowledge sharing on backend internals.

### Action Items
- Pin dependency versions and run deprecation checks in CI.
- Schedule weekly 30-min pairing sessions across frontend/backend.

---

## Sprint 3 (Nov 16 – Nov 22)
### What Went Well
- React Flow drag-and-drop approach proved intuitive; prototype demoed on Nov 25.
- Recharts integration for live loss/accuracy curves completed ahead of schedule.

### What Could Be Improved
- Some UI edge cases (e.g., invalid layer connections) lacked error feedback.
- Documentation lagged behind feature work; updated retroactively.

### Action Items
- Add inline validation messages in visual builder before Sprint 4.
- Treat docs updates as part of the Definition of Done for every PR.

---

## Sprint 4 (Nov 23 – Nov 24)
### What Went Well
- End-to-end integration testing caught critical path issues early on Nov 23.
- Tutorial content and README finalized; demo-ready by noon Nov 24.

### What Could Be Improved
- Tight 2-day window left little margin for last-minute bugs.
- Cross-browser testing (Safari/Edge) was best-effort only.

### Action Items (Post-Project)
- For future projects, reserve a full day for QA and docs before deadline.
- Automate cross-browser smoke tests in CI when time permits.

---

## Overall Takeaways
1. **Early API contracts** reduce integration pain.
2. **Test coverage targets** (>50%) catch regressions before they snowball.
3. **Frequent demos** keep the team aligned and surface UX issues early.
4. **Buffer time** before deadlines is essential for polish and documentation.
