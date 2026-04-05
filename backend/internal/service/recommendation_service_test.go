package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/uaad/backend/internal/config"
	"github.com/uaad/backend/internal/domain"
	"github.com/uaad/backend/internal/repository"
)

type stubRecommendationRepo struct {
	hotItems        []repository.RecommendationItem
	freshItems      []repository.RecommendationItem
	similarItems    []repository.RecommendationItem
	preferredItems  []repository.RecommendationItem
	behaviorCount   int64
	preferredCats   []string
	interactedIDs   []uint64
	publishedActs   []domain.Activity
	errHot          error
	errFresh        error
	errBehavior     error
	errPreferred    error
	errSimilar      error
	errInteracted   error
	errPublished    error
	errUpsert       error
	errRank         error
	hotCalls        int
	freshCalls      int
	similarCalls    int
	byCategoryCalls int
	upsertCalls     int
	rankCalls       int
}

func (s *stubRecommendationRepo) ListHotActivities(limit, offset int) ([]repository.RecommendationItem, error) {
	s.hotCalls++
	if s.errHot != nil {
		return nil, s.errHot
	}
	if offset >= len(s.hotItems) {
		return []repository.RecommendationItem{}, nil
	}
	end := offset + limit
	if end > len(s.hotItems) {
		end = len(s.hotItems)
	}
	return s.hotItems[offset:end], nil
}

func (s *stubRecommendationRepo) ListFreshActivities(limit int) ([]repository.RecommendationItem, error) {
	s.freshCalls++
	if s.errFresh != nil {
		return nil, s.errFresh
	}
	if limit > len(s.freshItems) {
		limit = len(s.freshItems)
	}
	return s.freshItems[:limit], nil
}

func (s *stubRecommendationRepo) CountUserBehaviors(userID uint64) (int64, error) {
	if s.errBehavior != nil {
		return 0, s.errBehavior
	}
	return s.behaviorCount, nil
}

func (s *stubRecommendationRepo) ListUserInteractedActivityIDs(userID uint64, limit int) ([]uint64, error) {
	if s.errInteracted != nil {
		return nil, s.errInteracted
	}
	if limit > len(s.interactedIDs) {
		limit = len(s.interactedIDs)
	}
	return s.interactedIDs[:limit], nil
}

func (s *stubRecommendationRepo) ListPreferredCategories(userID uint64, limit int) ([]string, error) {
	if s.errPreferred != nil {
		return nil, s.errPreferred
	}
	if limit > len(s.preferredCats) {
		limit = len(s.preferredCats)
	}
	return s.preferredCats[:limit], nil
}

func (s *stubRecommendationRepo) ListHotActivitiesByCategories(categories []string, limit int) ([]repository.RecommendationItem, error) {
	s.byCategoryCalls++
	if limit > len(s.preferredItems) {
		limit = len(s.preferredItems)
	}
	return s.preferredItems[:limit], nil
}

func (s *stubRecommendationRepo) ListSimilarActivitiesBySeed(seedActivityIDs []uint64, limit int) ([]repository.RecommendationItem, error) {
	s.similarCalls++
	if s.errSimilar != nil {
		return nil, s.errSimilar
	}
	if limit > len(s.similarItems) {
		limit = len(s.similarItems)
	}
	return s.similarItems[:limit], nil
}

func (s *stubRecommendationRepo) ListPublishedActivitiesForScoring() ([]domain.Activity, error) {
	if s.errPublished != nil {
		return nil, s.errPublished
	}
	return s.publishedActs, nil
}

func (s *stubRecommendationRepo) UpsertActivityScore(activityID uint64, score float64, components string, calculatedAt time.Time) error {
	s.upsertCalls++
	if s.errUpsert != nil {
		return s.errUpsert
	}
	return nil
}

func (s *stubRecommendationRepo) UpdateScoreRanks() error {
	s.rankCalls++
	if s.errRank != nil {
		return s.errRank
	}
	return nil
}

func TestRecommendationService_AnonymousHotRanking(t *testing.T) {
	repo := &stubRecommendationRepo{
		hotItems: []repository.RecommendationItem{
			{ActivityID: 1, Title: "hot-1"},
			{ActivityID: 2, Title: "hot-2"},
		},
		freshItems: []repository.RecommendationItem{{ActivityID: 3, Title: "fresh-1"}},
	}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)

	res, err := svc.GetRecommendations(nil, 2, 0, false)
	if err != nil {
		t.Fatal(err)
	}
	if res.Strategy != "hot_ranking" {
		t.Fatalf("want hot_ranking, got %s", res.Strategy)
	}
	if len(res.List) != 2 {
		t.Fatalf("want 2 items, got %d", len(res.List))
	}
}

func TestRecommendationService_LoggedInColdFill(t *testing.T) {
	repo := &stubRecommendationRepo{
		behaviorCount: 5,
		preferredCats: []string{"CONCERT"},
		hotItems: []repository.RecommendationItem{
			{ActivityID: 1, Title: "hot-1"},
			{ActivityID: 2, Title: "hot-2"},
		},
		preferredItems: []repository.RecommendationItem{
			{ActivityID: 3, Title: "pref-1"},
		},
	}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)
	uid := uint64(42)

	res, err := svc.GetRecommendations(&uid, 2, 0, false)
	if err != nil {
		t.Fatal(err)
	}
	if res.Strategy != "cold_fill" {
		t.Fatalf("want cold_fill, got %s", res.Strategy)
	}
	if len(res.List) == 0 || res.List[0].RecommendReason == "" {
		t.Fatalf("want recommend_reason in response, got %+v", res.List)
	}
	if repo.byCategoryCalls == 0 {
		t.Fatal("expected category-based branch to run")
	}
}

func TestRecommendationService_LoggedInCollaborativeFiltering(t *testing.T) {
	repo := &stubRecommendationRepo{
		behaviorCount: 30,
		interactedIDs: []uint64{10, 20, 30},
		similarItems: []repository.RecommendationItem{
			{ActivityID: 101, Title: "cf-1"},
			{ActivityID: 102, Title: "cf-2"},
		},
		hotItems: []repository.RecommendationItem{
			{ActivityID: 201, Title: "hot-1"},
		},
		freshItems: []repository.RecommendationItem{
			{ActivityID: 301, Title: "fresh-1"},
		},
	}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)
	uid := uint64(7)

	res, err := svc.GetRecommendations(&uid, 3, 0, false)
	if err != nil {
		t.Fatal(err)
	}
	if res.Strategy != "collaborative_filtering" {
		t.Fatalf("want collaborative_filtering, got %s", res.Strategy)
	}
	if repo.similarCalls == 0 {
		t.Fatal("expected collaborative filtering query to be called")
	}
	if len(res.List) == 0 {
		t.Fatal("want non-empty recommendation list")
	}
}

func TestRecommendationService_CacheHit(t *testing.T) {
	repo := &stubRecommendationRepo{
		hotItems:   []repository.RecommendationItem{{ActivityID: 1, Title: "hot-1"}},
		freshItems: []repository.RecommendationItem{},
	}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)

	if _, err := svc.GetRecommendations(nil, 1, 0, false); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.GetRecommendations(nil, 1, 0, false); err != nil {
		t.Fatal(err)
	}
	if repo.hotCalls != 1 {
		t.Fatalf("cache expected to prevent duplicate query, hotCalls=%d", repo.hotCalls)
	}
}

func TestRecommendationService_RecalculateAllScores(t *testing.T) {
	repo := &stubRecommendationRepo{
		publishedActs: []domain.Activity{
			{ID: 1, ViewCount: 100, EnrollCount: 20, MaxCapacity: 100, CreatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: 2, ViewCount: 50, EnrollCount: 10, MaxCapacity: 100, CreatedAt: time.Now().Add(-3 * time.Hour)},
		},
	}
	weights := config.ScoringWeights{ViewWeight: 0.2, EnrollWeight: 0.35, SpeedWeight: 0.25, TimeDecayWeight: 0.2, HotTTLLHours: 720}
	svc := NewRecommendationService(repo, weights, 5*time.Minute)

	if err := svc.RecalculateAllScores(context.Background()); err != nil {
		t.Fatal(err)
	}
	if repo.upsertCalls != 2 {
		t.Fatalf("want 2 upserts, got %d", repo.upsertCalls)
	}
	if repo.rankCalls != 1 {
		t.Fatalf("want rank update once, got %d", repo.rankCalls)
	}
}

func TestRecommendationService_GetRecommendations_InvalidArgs(t *testing.T) {
	svc := NewRecommendationService(&stubRecommendationRepo{}, config.ScoringWeights{}, 5*time.Minute)

	if _, err := svc.GetRecommendations(nil, 0, 0, false); !errors.Is(err, ErrInvalidRecommendationLimit) {
		t.Fatalf("want ErrInvalidRecommendationLimit, got %v", err)
	}
	if _, err := svc.GetRecommendations(nil, 10, -1, false); !errors.Is(err, ErrInvalidRecommendationOffset) {
		t.Fatalf("want ErrInvalidRecommendationOffset, got %v", err)
	}
}

func TestRecommendationService_GetHotRecommendations_InvalidArgs(t *testing.T) {
	svc := NewRecommendationService(&stubRecommendationRepo{}, config.ScoringWeights{}, 5*time.Minute)

	if _, err := svc.GetHotRecommendations(101, 0, false); !errors.Is(err, ErrInvalidRecommendationLimit) {
		t.Fatalf("want ErrInvalidRecommendationLimit, got %v", err)
	}
	if _, err := svc.GetHotRecommendations(10, -1, false); !errors.Is(err, ErrInvalidRecommendationOffset) {
		t.Fatalf("want ErrInvalidRecommendationOffset, got %v", err)
	}
}

func TestRecommendationService_GetHotRecommendations_NeedRefreshBypassCache(t *testing.T) {
	repo := &stubRecommendationRepo{hotItems: []repository.RecommendationItem{{ActivityID: 1, Title: "h1"}}}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)

	if _, err := svc.GetHotRecommendations(1, 0, false); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.GetHotRecommendations(1, 0, true); err != nil {
		t.Fatal(err)
	}
	if repo.hotCalls != 2 {
		t.Fatalf("want 2 calls due to need_refresh bypass, got %d", repo.hotCalls)
	}
}

func TestRecommendationService_GetRecommendations_NeedRefreshBypassCache(t *testing.T) {
	repo := &stubRecommendationRepo{hotItems: []repository.RecommendationItem{{ActivityID: 1, Title: "h1"}}, freshItems: []repository.RecommendationItem{}}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)

	if _, err := svc.GetRecommendations(nil, 1, 0, false); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.GetRecommendations(nil, 1, 0, true); err != nil {
		t.Fatal(err)
	}
	if repo.hotCalls != 2 {
		t.Fatalf("want 2 hot calls due to need_refresh bypass, got %d", repo.hotCalls)
	}
}

func TestRecommendationService_ThresholdBoundary_UsesColdFill(t *testing.T) {
	repo := &stubRecommendationRepo{
		behaviorCount:  20,
		preferredCats:  []string{"CONCERT"},
		hotItems:       []repository.RecommendationItem{{ActivityID: 1, Title: "hot"}},
		preferredItems: []repository.RecommendationItem{{ActivityID: 2, Title: "pref"}},
	}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)
	uid := uint64(11)

	res, err := svc.GetRecommendations(&uid, 2, 0, false)
	if err != nil {
		t.Fatal(err)
	}
	if res.Strategy != "cold_fill" {
		t.Fatalf("want cold_fill at threshold, got %s", res.Strategy)
	}
	if repo.similarCalls != 0 {
		t.Fatalf("similar should not be called at threshold, got %d", repo.similarCalls)
	}
}

func TestRecommendationService_LoggedInCollaborative_NoSeedFallback(t *testing.T) {
	repo := &stubRecommendationRepo{
		behaviorCount:  30,
		interactedIDs:  []uint64{},
		preferredCats:  []string{"EXPO"},
		hotItems:       []repository.RecommendationItem{{ActivityID: 1, Title: "hot"}},
		preferredItems: []repository.RecommendationItem{{ActivityID: 2, Title: "pref"}},
	}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)
	uid := uint64(9)

	res, err := svc.GetRecommendations(&uid, 2, 0, false)
	if err != nil {
		t.Fatal(err)
	}
	if res.Strategy != "cold_fill" {
		t.Fatalf("want cold_fill fallback, got %s", res.Strategy)
	}
	if repo.similarCalls != 0 {
		t.Fatalf("similar should not be called without seed, got %d", repo.similarCalls)
	}
}

func TestRecommendationService_RecalculateAllScores_ContextCanceled(t *testing.T) {
	repo := &stubRecommendationRepo{publishedActs: []domain.Activity{{ID: 1, MaxCapacity: 1, CreatedAt: time.Now().Add(-time.Hour)}}}
	svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := svc.RecalculateAllScores(ctx)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("want context.Canceled, got %v", err)
	}
	if repo.upsertCalls != 0 {
		t.Fatalf("upsert should not run on canceled context, got %d", repo.upsertCalls)
	}
}

func TestRecommendationService_RecalculateAllScores_RepoErrors(t *testing.T) {
	t.Run("published query error", func(t *testing.T) {
		repo := &stubRecommendationRepo{errPublished: errors.New("query failed")}
		svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)
		if err := svc.RecalculateAllScores(context.Background()); err == nil {
			t.Fatal("want error")
		}
	})

	t.Run("upsert error", func(t *testing.T) {
		repo := &stubRecommendationRepo{
			publishedActs: []domain.Activity{{ID: 1, MaxCapacity: 10, CreatedAt: time.Now().Add(-time.Hour)}},
			errUpsert:     errors.New("upsert failed"),
		}
		svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)
		if err := svc.RecalculateAllScores(context.Background()); err == nil {
			t.Fatal("want error")
		}
	})

	t.Run("rank error", func(t *testing.T) {
		repo := &stubRecommendationRepo{
			publishedActs: []domain.Activity{{ID: 1, MaxCapacity: 10, CreatedAt: time.Now().Add(-time.Hour)}},
			errRank:       errors.New("rank failed"),
		}
		svc := NewRecommendationService(repo, config.ScoringWeights{}, 5*time.Minute)
		if err := svc.RecalculateAllScores(context.Background()); err == nil {
			t.Fatal("want error")
		}
	})
}
