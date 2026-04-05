# Task: Backend Core Foundations (BE-02 & BE-03)

- [x] [BE-02] Database Connection Pool Optimization
  - [x] Extract `*sql.DB` from GORM instance in `main.go`.
  - [x] Configure `MaxIdleConns`, `MaxOpenConns`, and `ConnMaxLifetime`.
- [x] [BE-03] Registration Anti-Spam / Rate Limiting
  - [x] Create IP-based rate limiter middleware in `backend/internal/middleware/rate_limit.go`.
  - [x] Integrate the rate limiter into the registration route in `main.go`.
  - [x] Verify the rate limiter with multiple rapid requests. (Verified: HTTP 429 confirmed)

# Task: Recommendation Module Phase 1 (RE-L1-L2)

- [x] [RE-01] Recommendation repository and query model
  - [x] Add `internal/repository/recommendation_repository.go`.
  - [x] Implement hot list query (`activity_scores` + `activities`).
  - [x] Implement fresh list and user preference category query.
  - [x] Implement score upsert and rank refresh methods.

- [x] [RE-02] Recommendation service and scoring engine
  - [x] Add `internal/service/recommendation_service.go`.
  - [x] Implement `GET /recommendations` strategy split (anonymous/logged-in).
  - [x] Implement cold-fill merge for logged-in users with behavior data.
  - [x] Implement periodic score recalculation (L2 weighted scoring).
  - [x] Add in-process 5-minute TTL cache and `need_refresh` bypass.

- [x] [RE-03] API delivery and router integration
  - [x] Add `internal/handler/recommendation_handler.go` and `recommendation_routes.go`.
  - [x] Register routes in `cmd/server/main.go` with `OptionalJWTAuth`.
  - [x] Add periodic score recalculation goroutine in `main.go`.

- [x] [RE-04] Tests and verification
  - [x] Add `internal/service/recommendation_service_test.go` unit tests.
  - [x] Add response contract test for `/recommendations/hot` in `tests/response_contract_test.go`.
  - [x] Run `go test ./internal/service/... -count=1` (pass).
  - [x] Run `go test ./... -count=1` (pass).

# Task: Recommendation Module Phase 2 (RE-L3)

- [x] [RE-05] Collaborative filtering repository capability
  - [x] Add interacted activity id query from `user_behaviors`.
  - [x] Add SQL-based co-occurrence similar activity query.

- [x] [RE-06] L3 strategy in recommendation service
  - [x] Use `collaborative_filtering` when behavior count > 20.
  - [x] Implement hybrid merge: CF + Hot + Fresh.
  - [x] Keep fallback to `cold_fill` when user lacks seed activities.

- [x] [RE-07] L3 tests and regression verification
  - [x] Extend recommendation service test stubs for new repo methods.
  - [x] Add collaborative filtering branch unit test.
  - [x] Run `go test ./internal/service/... -count=1` (pass).
  - [x] Run `go test ./... -count=1` (pass).

# Task: Recommendation Module Phase 3 (RE-Validation)

- [x] [RE-08] Recommendation HTTP handler tests
  - [x] Add `internal/handler/recommendation_handler_test.go`.
  - [x] Verify query parsing (`limit`, `offset`, `need_refresh`).
  - [x] Verify strategy field output for `/recommendations`.
  - [x] Verify error mapping for bad params and internal failure paths.

- [x] [RE-09] Response contract enhancement
  - [x] Add `/recommendations` strategy assertion in `tests/response_contract_test.go`.
  - [x] Keep `/recommendations/hot` contract test.

- [x] [RE-10] Final verification
  - [x] Run `go test ./internal/handler/... -count=1` (pass).
  - [x] Run `go test ./internal/service/... -count=1` (pass).
  - [x] Run `go test ./... -count=1` (pass).

# Task: Recommendation Module Test Expansion (RE-Test-Plus)

- [x] [RE-11] Service-layer scenario expansion
  - [x] Add invalid arg tests (`limit`, `offset`) for recommendations and hot recommendations.
  - [x] Add `need_refresh` bypass cache tests.
  - [x] Add threshold boundary test (`behavior_count == 20` => `cold_fill`).
  - [x] Add collaborative fallback test (no seed activities).
  - [x] Add recalculate error-path tests (published query / upsert / rank) and canceled-context test.

- [x] [RE-12] Handler-layer boundary expansion
  - [x] Add invalid `offset` tests for both list and hot endpoints.
  - [x] Add internal-error mapping test for `/recommendations`.
  - [x] Add anonymous-path test to ensure nil user id behavior.
  - [x] Add service validation error mapping test for hot endpoint.

- [x] [RE-13] Verification
  - [x] Run `go test ./internal/handler/... -count=1` (pass).
  - [x] Run `go test ./internal/service/... -count=1` (pass).
  - [x] Run `go test ./... -count=1` (pass).
