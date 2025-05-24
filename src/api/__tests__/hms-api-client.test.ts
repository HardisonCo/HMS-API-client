/**
 * HMS API Client Test Suite
 * 
 * Comprehensive tests for all new API client modules
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  createHmsApiClient,
  createGovApiClient,
  createMktApiClient,
  createMfeApiClient,
  OrderStatus,
  ChallengeType,
  ChallengeStatus,
  AssessmentStatus,
  QuestionType,
  ActivityType,
  ActivityStatus,
  FollowUpType,
  FollowUpStatus,
  NudgeStatus
} from '../hms-api-client';

describe('HMS API Client', () => {
  let mock: MockAdapter;
  let apiClient: ReturnType<typeof createHmsApiClient>;

  beforeAll(() => {
    mock = new MockAdapter(axios);
    apiClient = createHmsApiClient({
      baseURL: 'http://test-api.local',
      enableLogging: false
    });
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  // =================== ENVIRONMENT-SPECIFIC CLIENTS =====================

  describe('Environment-Specific Clients', () => {
    it('should create GOV client with correct configuration', () => {
      const govClient = createGovApiClient({
        enableLogging: true
      });
      
      expect(govClient).toBeDefined();
      expect(govClient.auth).toBeDefined();
      expect(govClient.order).toBeDefined();
      expect(govClient.challenge).toBeDefined();
    });

    it('should create MKT client with correct configuration', () => {
      const mktClient = createMktApiClient();
      
      expect(mktClient).toBeDefined();
      expect(mktClient.auth).toBeDefined();
      expect(mktClient.nudge).toBeDefined();
    });

    it('should create MFE client with correct configuration', () => {
      const mfeClient = createMfeApiClient();
      
      expect(mfeClient).toBeDefined();
      expect(mfeClient.auth).toBeDefined();
      expect(mfeClient.activity).toBeDefined();
    });
  });

  // =================== ORDER API CLIENT TESTS =====================

  describe('Order API Client', () => {
    it('should run order execution', async () => {
      const mockResponse = { success: true, data: { id: 1, status: 'running' } };
      mock.onGet('/order/run/1/123').reply(200, mockResponse);

      const response = await apiClient.order.runOrder(1, 123);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should start checkout process', async () => {
      const checkoutData = {
        chainId: 123,
        items: [{ itemId: 1, quantity: 2 }],
        paymentMethodId: 'pm_123'
      };
      const mockResponse = {
        success: true,
        data: {
          sessionId: 'sess_123',
          totalAmount: 2000,
          currency: 'USD',
          expiresAt: '2024-01-01T00:00:00Z'
        }
      };
      
      mock.onPost('/order/checkout', checkoutData).reply(200, mockResponse);

      const response = await apiClient.order.startCheckout(checkoutData);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should get orders by status', async () => {
      const mockOrders = {
        success: true,
        data: [
          {
            id: 1,
            userId: 123,
            chainId: 456,
            protocolId: 789,
            status: OrderStatus.COMPLETED,
            totalAmount: 1000,
            currency: 'USD',
            items: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      mock.onGet('/orders/completed').reply(200, mockOrders);

      const response = await apiClient.order.getOrdersByStatus('completed');
      
      expect(response.data).toEqual(mockOrders);
      expect(response.data.data[0].status).toBe(OrderStatus.COMPLETED);
    });
  });

  // =================== CHALLENGE API CLIENT TESTS =====================

  describe('Challenge API Client', () => {
    it('should run challenge', async () => {
      const challengeData = {
        challengeId: 1,
        chainId: 123,
        parameters: { difficulty: 'medium' }
      };
      const mockResponse = { success: true, data: { started: true } };
      
      mock.onPost('/challenge/run', challengeData).reply(200, mockResponse);

      const response = await apiClient.challenge.runChallenge(challengeData);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should record video with proper file upload', async () => {
      const videoFile = new File(['test video content'], 'test.mp4', { type: 'video/mp4' });
      const mockResponse = {
        success: true,
        data: {
          videoId: 'vid_123',
          videoUrl: 'https://example.com/video.mp4',
          duration: 120
        }
      };
      
      mock.onPost('/challenge/record-video').reply(200, mockResponse);

      const response = await apiClient.challenge.recordVideo(videoFile, 1, { quality: 'high' });
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should get challenge by ID and chain', async () => {
      const mockChallenge = {
        success: true,
        data: {
          id: 1,
          name: 'Test Challenge',
          description: 'A test challenge',
          type: ChallengeType.VIDEO,
          protocolId: 123,
          chainId: 456,
          status: ChallengeStatus.ACTIVE,
          settings: {
            duration: 300,
            maxAttempts: 3,
            requiredCompletion: true
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };
      
      mock.onGet('/challenge/get-challenge/1/456').reply(200, mockChallenge);

      const response = await apiClient.challenge.getChallenge(1, 456);
      
      expect(response.data).toEqual(mockChallenge);
      expect(response.data.data.type).toBe(ChallengeType.VIDEO);
    });
  });

  // =================== ASSESSMENTS API CLIENT TESTS =====================

  describe('Assessments API Client', () => {
    it('should run assessment', async () => {
      const mockResponse = { success: true, data: { assessmentStarted: true } };
      
      mock.onGet('/assessment/run/1/123').reply(200, mockResponse);

      const response = await apiClient.assessments.runAssessment(1, 123);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should get questions by assessment', async () => {
      const mockQuestions = {
        success: true,
        data: [
          {
            id: 1,
            assessmentId: 1,
            text: 'What is your age?',
            type: QuestionType.TEXT,
            order: 1,
            required: true,
            choices: []
          }
        ]
      };
      
      mock.onGet('/question/by-assessment/1').reply(200, mockQuestions);

      const response = await apiClient.assessments.getQuestionsByAssessment(1);
      
      expect(response.data).toEqual(mockQuestions);
      expect(response.data.data[0].type).toBe(QuestionType.TEXT);
    });

    it('should store response', async () => {
      const responseData = {
        assessmentId: 1,
        questionId: 1,
        textValue: 'Test response'
      };
      const mockResponse = { success: true, data: responseData };
      
      mock.onPost('/response/store', responseData).reply(200, mockResponse);

      const response = await apiClient.assessments.storeResponse(responseData);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should submit assessment with multiple responses', async () => {
      const responses = [
        { assessmentId: 1, questionId: 1, textValue: 'Answer 1' },
        { assessmentId: 1, questionId: 2, choiceId: 5 }
      ];
      const mockResponse = { success: true, data: { submitted: true, score: 85 } };
      
      mock.onPost('/assessment/1/submit', { responses }).reply(200, mockResponse);

      const response = await apiClient.assessments.submitAssessment(1, responses);
      
      expect(response.data).toEqual(mockResponse);
    });
  });

  // =================== ACTIVITY API CLIENT TESTS =====================

  describe('Activity API Client', () => {
    it('should get running activities', async () => {
      const queryData = {
        type: ActivityType.EXERCISE,
        available: true
      };
      const mockActivities = {
        success: true,
        data: [
          {
            id: 1,
            name: 'Yoga Class',
            description: 'Morning yoga session',
            type: ActivityType.EXERCISE,
            status: ActivityStatus.AVAILABLE,
            settings: {
              duration: 60,
              capacity: 20,
              price: 25
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      mock.onPost('/activity/running', queryData).reply(200, mockActivities);

      const response = await apiClient.activity.getRunningActivities(queryData);
      
      expect(response.data).toEqual(mockActivities);
      expect(response.data.data[0].type).toBe(ActivityType.EXERCISE);
    });

    it('should set reservation', async () => {
      const reservationData = {
        activityId: 1,
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        participants: 1,
        notes: 'First time participant'
      };
      const mockResponse = { success: true, data: { ...reservationData, id: 123 } };
      
      mock.onPost('/activity/set-reservation', reservationData).reply(200, mockResponse);

      const response = await apiClient.activity.setReservation(reservationData);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should get booked events for month', async () => {
      const mockEvents = {
        success: true,
        data: [
          {
            id: 1,
            activityId: 1,
            startTime: '2024-01-15T10:00:00Z',
            endTime: '2024-01-15T11:00:00Z',
            status: 'scheduled',
            participants: 1,
            maxParticipants: 20,
            activity: {
              id: 1,
              name: 'Yoga Class',
              type: ActivityType.EXERCISE
            }
          }
        ]
      };
      
      mock.onGet('/activity/booked-events-month/2024-01').reply(200, mockEvents);

      const response = await apiClient.activity.getBookedEventsForMonth('2024-01');
      
      expect(response.data).toEqual(mockEvents);
    });
  });

  // =================== FOLLOWUPS API CLIENT TESTS =====================

  describe('FollowUps API Client', () => {
    it('should run follow-up', async () => {
      const mockResponse = { success: true, data: { followUpStarted: true } };
      
      mock.onGet('/follow-up/run/123').reply(200, mockResponse);

      const response = await apiClient.followUps.runFollowUp(123);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should record voice with proper file upload', async () => {
      const audioFile = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
      const mockResponse = {
        success: true,
        data: {
          recordingId: 'rec_123',
          audioUrl: 'https://example.com/audio.mp3',
          duration: 60
        }
      };
      
      mock.onPost('/follow-up/voice-record').reply(200, mockResponse);

      const response = await apiClient.followUps.recordVoice(audioFile, 1, { quality: 'high' });
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should get timeline for chain', async () => {
      const mockTimeline = {
        success: true,
        data: [
          {
            id: 1,
            chainId: 123,
            type: 'follow_up',
            title: 'Follow-up completed',
            description: 'User completed follow-up session',
            data: {},
            timestamp: '2024-01-01T12:00:00Z',
            userId: 456,
            user: {
              id: 456,
              name: 'John Doe'
            }
          }
        ]
      };
      
      mock.onGet('/follow-up/get-timeline/123').reply(200, mockTimeline);

      const response = await apiClient.followUps.getTimeline(123);
      
      expect(response.data).toEqual(mockTimeline);
    });
  });

  // =================== NUDGE API CLIENT TESTS =====================

  describe('Nudge API Client', () => {
    it('should check nudge secret (public endpoint)', async () => {
      const mockResponse = { success: true, data: true };
      
      mock.onGet('/nudge/check/secret123').reply(200, mockResponse);

      const response = await apiClient.nudge.checkNudgeSecret('secret123');
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should handle email check-in (public endpoint)', async () => {
      const checkinData = {
        nudgeId: 1,
        response: 'Feeling good today',
        metadata: { mood: 'positive' }
      };
      const mockResponse = { success: true, data: null };
      
      mock.onPost('/nudge-checkin/email', { 
        email: 'test@example.com', 
        ...checkinData 
      }).reply(200, mockResponse);

      const response = await apiClient.nudge.emailCheckin('test@example.com', checkinData);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should create nudge with image upload', async () => {
      const imageFile = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
      const nudgeData = {
        name: 'Daily Reminder',
        description: 'Daily health check reminder',
        protocolId: 123,
        chainId: 456,
        settings: {
          frequency: 'daily',
          channels: ['email', 'sms']
        },
        image: imageFile
      };
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          name: 'Daily Reminder',
          status: NudgeStatus.ACTIVE,
          secret: 'secret123',
          imageUrl: 'https://example.com/image.jpg'
        }
      };
      
      mock.onPost('/nudge').reply(200, mockResponse);

      const response = await apiClient.nudge.createNudge(nudgeData);
      
      expect(response.data).toEqual(mockResponse);
    });

    it('should get all protocol nudges', async () => {
      const mockNudges = {
        success: true,
        data: [
          {
            id: 1,
            name: 'Daily Reminder',
            description: 'Daily health check',
            secret: 'secret123',
            protocolId: 123,
            chainId: 456,
            status: NudgeStatus.ACTIVE,
            settings: {
              frequency: 'daily',
              channels: ['email']
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      mock.onGet('/protocol/nudge/all').reply(200, mockNudges);

      const response = await apiClient.nudge.getAllProtocolNudges();
      
      expect(response.data).toEqual(mockNudges);
      expect(response.data.data[0].status).toBe(NudgeStatus.ACTIVE);
    });
  });

  // =================== ERROR HANDLING TESTS =====================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mock.onGet('/order/run/1/123').networkError();

      await expect(apiClient.order.runOrder(1, 123)).rejects.toThrow();
    });

    it('should handle 404 errors', async () => {
      mock.onGet('/challenge/999').reply(404, { 
        success: false, 
        message: 'Challenge not found' 
      });

      await expect(apiClient.challenge.getChallenge(999, 123)).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const invalidData = { name: '' }; // Invalid data
      mock.onPost('/assessment').reply(422, {
        success: false,
        message: 'Validation failed',
        data: {
          errors: {
            name: ['The name field is required.']
          }
        }
      });

      await expect(apiClient.assessments.createAssessment(invalidData as any)).rejects.toThrow();
    });
  });

  // =================== REQUEST INTERCEPTORS TESTS =====================

  describe('Request Interceptors', () => {
    it('should add authentication token to requests', async () => {
      // Mock localStorage
      const mockToken = 'test-token-123';
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue(mockToken),
          setItem: jest.fn(),
          removeItem: jest.fn()
        },
        writable: true
      });

      mock.onGet('/order').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${mockToken}`);
        return [200, { success: true, data: [] }];
      });

      await apiClient.order.getUserOrders();
    });

    it('should add tenant ID header when provided', () => {
      const clientWithTenant = createHmsApiClient({
        baseURL: 'http://test-api.local',
        tenantId: 'tenant-123'
      });

      mock.onGet('/order').reply((config) => {
        expect(config.headers?.['X-Tenant-ID']).toBe('tenant-123');
        return [200, { success: true, data: [] }];
      });

      return clientWithTenant.order.getUserOrders();
    });

    it('should add environment context header', () => {
      const govClient = createGovApiClient();

      mock.onGet('/order').reply((config) => {
        expect(config.headers?.['X-Client-Environment']).toBe('gov');
        return [200, { success: true, data: [] }];
      });

      return govClient.order.getUserOrders();
    });
  });
});