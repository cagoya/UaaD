package worker

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/uaad/backend/internal/domain"
	"github.com/uaad/backend/internal/middleware"
	"github.com/uaad/backend/internal/service"
	"gorm.io/gorm"
)

// EnrollmentWorker consumes enrollment messages from Kafka and persists
// them to MySQL. On transaction failure it compensates Redis via StockEngine.
type EnrollmentWorker struct {
	reader      *kafka.Reader
	db          *gorm.DB
	stockEngine service.StockEngine
	notifSvc    service.NotificationService
	activityRepo interface {
		FindByID(id uint64) (*domain.Activity, error)
	}
}

// NewEnrollmentWorker creates a new worker.
func NewEnrollmentWorker(
	reader *kafka.Reader,
	db *gorm.DB,
	stockEngine service.StockEngine,
	notifSvc service.NotificationService,
	activityRepo interface{ FindByID(id uint64) (*domain.Activity, error) },
) *EnrollmentWorker {
	return &EnrollmentWorker{
		reader:       reader,
		db:           db,
		stockEngine:  stockEngine,
		notifSvc:     notifSvc,
		activityRepo: activityRepo,
	}
}

// Run starts the consume loop. It blocks until ctx is cancelled.
func (w *EnrollmentWorker) Run(ctx context.Context) {
	log.Println("[EnrollWorker] started")
	for {
		msg, err := w.reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				log.Println("[EnrollWorker] context cancelled, stopping")
				return
			}
			log.Printf("[EnrollWorker] read error: %v", err)
			time.Sleep(time.Second)
			continue
		}
		stats := w.reader.Stats()
		middleware.SetWorkerKafkaLag(stats.Topic, stats.Lag)
		w.handleMessage(ctx, msg)
	}
}

func (w *EnrollmentWorker) handleMessage(ctx context.Context, msg kafka.Message) {
	var em service.EnrollmentMessage
	if err := json.Unmarshal(msg.Value, &em); err != nil {
		log.Printf("[EnrollWorker] unmarshal error: %v, payload: %s", err, string(msg.Value))
		return
	}

	now := time.Now()
	queuePos := int(em.QueuePos)

	var enrollment domain.Enrollment
	var order domain.Order

	err := w.db.Transaction(func(tx *gorm.DB) error {
		enrollment = domain.Enrollment{
			UserID:        em.UserID,
			ActivityID:    em.ActivityID,
			Status:        "SUCCESS",
			QueuePosition: &queuePos,
			EnrolledAt:    now,
		}
		finalizedAt := now
		enrollment.FinalizedAt = &finalizedAt
		if err := tx.Create(&enrollment).Error; err != nil {
			return err
		}

		order = domain.Order{
			OrderNo:      service.GenerateOrderNo(),
			EnrollmentID: enrollment.ID,
			UserID:       em.UserID,
			ActivityID:   em.ActivityID,
			Amount:       em.Price,
			Status:       "PENDING",
			ExpiredAt:    now.Add(15 * time.Minute),
		}
		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		return nil
	})

	activityTitle := "unknown"
	if act, e := w.activityRepo.FindByID(em.ActivityID); e == nil {
		activityTitle = act.Title
	}

	if err != nil {
		log.Printf("[EnrollWorker] MySQL tx failed for user=%d activity=%d: %v — rolling back Redis", em.UserID, em.ActivityID, err)
		if rbErr := w.stockEngine.Rollback(ctx, em.ActivityID, em.UserID); rbErr != nil {
			log.Printf("[EnrollWorker] CRITICAL: Redis rollback also failed: %v", rbErr)
		}
		w.notifSvc.NotifyEnrollFail(em.UserID, 0, activityTitle)
		middleware.RecordWorkerMessage("failure", time.Since(now).Seconds())
		return
	}

	w.notifSvc.NotifyEnrollSuccess(em.UserID, enrollment.ID, activityTitle)
	middleware.RecordWorkerMessage("success", time.Since(now).Seconds())
}
