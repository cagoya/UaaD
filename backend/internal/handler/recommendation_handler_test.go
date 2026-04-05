package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/uaad/backend/internal/service"
)

type stubRecommendationService struct {
	result             service.RecommendationResult
	err                error
	lastNeedRefresh    bool
	lastLimit          int
	lastOffset         int
	lastCalledHot      bool
	lastHasUserID      bool
	lastUserID         uint64
	hotResult          service.RecommendationResult
	hotErr             error
	hotLastNeedRefresh bool
	hotLastLimit       int
	hotLastOffset      int
}

func (s *stubRecommendationService) GetRecommendations(userID *uint64, limit, offset int, needRefresh bool) (service.RecommendationResult, error) {
	s.lastNeedRefresh = needRefresh
	s.lastLimit = limit
	s.lastOffset = offset
	s.lastCalledHot = false
	if userID != nil {
		s.lastHasUserID = true
		s.lastUserID = *userID
	} else {
		s.lastHasUserID = false
		s.lastUserID = 0
	}
	if s.err != nil {
		return service.RecommendationResult{}, s.err
	}
	return s.result, nil
}

func (s *stubRecommendationService) GetHotRecommendations(limit, offset int, needRefresh bool) (service.RecommendationResult, error) {
	s.hotLastNeedRefresh = needRefresh
	s.hotLastLimit = limit
	s.hotLastOffset = offset
	s.lastCalledHot = true
	if s.hotErr != nil {
		return service.RecommendationResult{}, s.hotErr
	}
	return s.hotResult, nil
}

func (s *stubRecommendationService) RecalculateAllScores(_ context.Context) error {
	return nil
}

func TestRecommendationHandler_List_OK(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{
		result: service.RecommendationResult{
			List:     []service.RecommendationItemDTO{{ActivityID: 1, Title: "A"}},
			Total:    1,
			Strategy: "cold_fill",
		},
	}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations", func(c *gin.Context) {
		uid := uint64(99)
		c.Set("user_id", uid)
		h.List(c)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations?limit=10&offset=2&need_refresh=true", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if body["strategy"] != "cold_fill" {
		t.Fatalf("want strategy=cold_fill, got %v", body["strategy"])
	}
	if !stub.lastNeedRefresh || stub.lastLimit != 10 || stub.lastOffset != 2 {
		t.Fatalf("service args mismatch: needRefresh=%v limit=%d offset=%d", stub.lastNeedRefresh, stub.lastLimit, stub.lastOffset)
	}
	if !stub.lastHasUserID || stub.lastUserID != 99 {
		t.Fatalf("want user_id=99 propagated, got has=%v uid=%d", stub.lastHasUserID, stub.lastUserID)
	}
}

func TestRecommendationHandler_List_InvalidLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations", h.List)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations?limit=abc", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d", w.Code)
	}
}

func TestRecommendationHandler_List_InvalidOffset(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations", h.List)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations?offset=bad", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d", w.Code)
	}
}

func TestRecommendationHandler_List_ServiceValidationError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{err: service.ErrInvalidRecommendationLimit}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations", h.List)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations?limit=999", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d", w.Code)
	}
}

func TestRecommendationHandler_List_ServiceInternalError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{err: errors.New("boom")}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations", h.List)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations?limit=20&offset=0", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("want 500, got %d", w.Code)
	}
}

func TestRecommendationHandler_List_AnonymousNoUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{result: service.RecommendationResult{Strategy: "hot_ranking"}}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations", h.List)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}
	if stub.lastHasUserID {
		t.Fatal("expected anonymous request to keep userID nil")
	}
}

func TestRecommendationHandler_Hot_OK(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{
		hotResult: service.RecommendationResult{
			List:     []service.RecommendationItemDTO{{ActivityID: 8, Title: "Hot"}},
			Total:    1,
			Strategy: "hot_ranking",
		},
	}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations/hot", h.Hot)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations/hot?limit=3&offset=1&need_refresh=true", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}
	if !stub.lastCalledHot || !stub.hotLastNeedRefresh || stub.hotLastLimit != 3 || stub.hotLastOffset != 1 {
		t.Fatalf("hot service args mismatch: calledHot=%v needRefresh=%v limit=%d offset=%d", stub.lastCalledHot, stub.hotLastNeedRefresh, stub.hotLastLimit, stub.hotLastOffset)
	}
}

func TestRecommendationHandler_Hot_InvalidOffset(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations/hot", h.Hot)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations/hot?offset=bad", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d", w.Code)
	}
}

func TestRecommendationHandler_Hot_ServiceValidationError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{hotErr: service.ErrInvalidRecommendationOffset}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations/hot", h.Hot)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations/hot?limit=20&offset=0", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d", w.Code)
	}
}

func TestRecommendationHandler_Hot_InternalError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	stub := &stubRecommendationService{hotErr: errors.New("db down")}
	h := NewRecommendationHandler(stub)

	r := gin.New()
	r.GET("/api/v1/recommendations/hot", h.Hot)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/recommendations/hot", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("want 500, got %d", w.Code)
	}
}
