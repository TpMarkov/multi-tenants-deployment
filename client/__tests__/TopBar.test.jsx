import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from '@/components/layout/TopBar';

const mockPush = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockToggleSound = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('@/store/useAdminStore', () => ({
  useAdminStore: () => ({ user: { name: 'Admin', role: 'property_admin' } }),
}));

const buildState = (overrides = {}) => ({
  notifications: [
    {
      _id: 'n1',
      type: 'new_order',
      title: 'New Order #A1B2C3',
      message: 'Room #101 · 2× Burger',
      orderId: 'o1',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'n2',
      type: 'new_order',
      title: 'New Order #D4E5F6',
      message: 'Room #102',
      orderId: 'o2',
      isRead: true,
      createdAt: new Date().toISOString(),
    },
  ],
  unreadCount: 1,
  soundEnabled: true,
  toggleSound: mockToggleSound,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
  ...overrides,
});

jest.mock('@/store/useNotificationStore', () => ({
  useNotificationStore: (selector) => {
    const state = globalThis.__notifState;
    return selector ? selector(state) : state;
  },
}));

beforeEach(() => {
  mockPush.mockClear();
  mockMarkAsRead.mockClear();
  mockMarkAllAsRead.mockClear();
  globalThis.__notifState = buildState();
});

describe('TopBar notification bell', () => {
  test('renders the bell button', () => {
    render(<TopBar title="Orders" />);
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  test('shows a red badge with the unread count', () => {
    render(<TopBar title="Orders" />);
    const badge = screen.getByTestId('notification-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('1');
  });

  test('badge is hidden when there are no unread notifications', () => {
    globalThis.__notifState = buildState({ unreadCount: 0 });
    render(<TopBar title="Orders" />);
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  test('opens the dropdown and displays notifications', () => {
    render(<TopBar title="Orders" />);
    fireEvent.click(screen.getByTestId('notification-bell'));
    expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('notification-item')).toHaveLength(2);
  });

  test('clicking a notification marks it read and navigates to the order', () => {
    render(<TopBar title="Orders" />);
    fireEvent.click(screen.getByTestId('notification-bell'));
    const items = screen.getAllByTestId('notification-item');
    fireEvent.click(items[0]);

    expect(mockMarkAsRead).toHaveBeenCalledWith('n1');
    expect(mockPush).toHaveBeenCalledWith('/admin/orders?orderId=o1');
  });

  test('"Mark all read" clears the unread notifications', () => {
    render(<TopBar title="Orders" />);
    fireEvent.click(screen.getByTestId('notification-bell'));
    fireEvent.click(screen.getByText('Mark all read'));

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });
});
