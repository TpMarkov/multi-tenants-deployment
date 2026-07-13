import { useNotificationStore } from '@/store/useNotificationStore';

// Mock the API layer so the store never hits the network.
const mockGetNotifications = jest.fn();
const mockMarkNotificationRead = jest.fn();
const mockMarkAllNotificationsRead = jest.fn();

jest.mock('@/lib/api', () => ({
  getNotifications: (...args) => mockGetNotifications(...args),
  markNotificationRead: (...args) => mockMarkNotificationRead(...args),
  markAllNotificationsRead: (...args) => mockMarkAllNotificationsRead(...args),
  getUnreadNotificationCount: jest.fn(),
}));

const resetStore = () =>
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    soundEnabled: true,
    lastViewedAt: null,
    loading: false,
  });

beforeEach(() => {
  resetStore();
  mockGetNotifications.mockReset();
  mockMarkNotificationRead.mockReset();
  mockMarkAllNotificationsRead.mockReset();
});

describe('useNotificationStore', () => {
  test('addNotification increments the unread count and prepends the item', () => {
    useNotificationStore.getState().addNotification({
      _id: 'n1',
      type: 'new_order',
      title: 'New Order #A1B2C3',
      message: 'Room #101',
      orderId: 'o1',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]._id).toBe('n1');
  });

  test('multiple addNotification calls increment the badge correctly', () => {
    const store = useNotificationStore.getState();
    store.addNotification({ _id: 'a', orderId: 'o1', isRead: false, createdAt: new Date().toISOString() });
    store.addNotification({ _id: 'b', orderId: 'o2', isRead: false, createdAt: new Date().toISOString() });
    store.addNotification({ _id: 'c', orderId: 'o3', isRead: false, createdAt: new Date().toISOString() });

    expect(useNotificationStore.getState().unreadCount).toBe(3);
  });

  test('addNotification deduplicates by _id', () => {
    const store = useNotificationStore.getState();
    store.addNotification({ _id: 'dup', orderId: 'o1', isRead: false, createdAt: new Date().toISOString() });
    store.addNotification({ _id: 'dup', orderId: 'o1', isRead: false, createdAt: new Date().toISOString() });

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.notifications).toHaveLength(1);
  });

  test('markAsRead decrements unread count and persists on the server', async () => {
    const store = useNotificationStore.getState();
    store.addNotification({ _id: 'n1', orderId: 'o1', isRead: false, createdAt: new Date().toISOString() });
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    await useNotificationStore.getState().markAsRead('n1');

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications[0].isRead).toBe(true);
    expect(mockMarkNotificationRead).toHaveBeenCalledWith('n1');
  });

  test('markAllAsRead clears the unread count', async () => {
    const store = useNotificationStore.getState();
    store.addNotification({ _id: 'n1', orderId: 'o1', isRead: false, createdAt: new Date().toISOString() });
    store.addNotification({ _id: 'n2', orderId: 'o2', isRead: false, createdAt: new Date().toISOString() });

    await useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
    expect(mockMarkAllNotificationsRead).toHaveBeenCalled();
  });

  test('markAsReadByOrderId marks the matching unread notification', async () => {
    const store = useNotificationStore.getState();
    store.addNotification({ _id: 'n1', orderId: 'o1', isRead: false, createdAt: new Date().toISOString() });

    await useNotificationStore.getState().markAsReadByOrderId('o1');

    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(mockMarkNotificationRead).toHaveBeenCalledWith('n1');
  });

  test('fetchNotifications populates notifications and unread count from the API', async () => {
    mockGetNotifications.mockResolvedValue({
      data: {
        data: [
          { _id: 'n1', orderId: 'o1', isRead: false, createdAt: new Date().toISOString() },
          { _id: 'n2', orderId: 'o2', isRead: true, createdAt: new Date().toISOString() },
        ],
        unreadCount: 1,
      },
    });

    await useNotificationStore.getState().fetchNotifications();

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
    expect(mockGetNotifications).toHaveBeenCalled();
  });
});
