import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

const originalFetch = global.fetch;
const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;

function jsonResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  });
}

beforeEach(() => {
  window.history.pushState({}, '', '/');
  window.sessionStorage.removeItem('pulseline_ai_conversation_id');
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  global.fetch = jest.fn((url, options = {}) => {
    const endpoint = String(url);
    if (endpoint.includes('/auth/me/')) {
      return jsonResponse(
        { detail: 'Authentication credentials were not provided.' },
        403
      );
    }
    if (endpoint.includes('/auth/csrf/')) {
      return jsonResponse({ csrfToken: 'test-csrf-token' });
    }
    if (endpoint.includes('/auth/login/') || endpoint.includes('/auth/signup/')) {
      return jsonResponse({
        csrfToken: 'rotated-csrf-token',
        user: {
          id: 1,
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          phone: '555-0101',
          dateJoined: '2026-01-01T00:00:00Z',
        },
      });
    }
    if (endpoint.includes('/ai-assistant/chat/')) {
      const language = options.body?.get('language') || 'en-IN';
      return jsonResponse({
        answer: language === 'bn-IN' ? 'বাংলায় উত্তর' : 'Hello from Gemini.',
        source: 'Gemini · PULSELINE',
        sources: [],
        language,
      });
    }
    if (
      endpoint.includes('/hospital/profile/') ||
      endpoint.includes('/notices/')
    ) {
      return new Promise(() => {});
    }
    return jsonResponse({});
  });
});

afterEach(() => {
  if (originalFetch) {
    global.fetch = originalFetch;
  } else {
    delete global.fetch;
  }
  if (originalScrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    delete window.HTMLElement.prototype.scrollIntoView;
  }
});

test('renders the PULSELINE home page', async () => {
  render(<App />);
  await screen.findByRole('link', { name: 'Sign in' });
  expect(
    screen.getByRole('heading', { name: /welcome to smart healthcare/i })
  ).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  expect(
    within(screen.getByRole('navigation', { name: /main navigation/i }))
      .getByRole('link', { name: 'Home' })
  ).toHaveAttribute('href', '/');
});

test('shows sign-in and sign-up links when logged out', async () => {
  render(<App />);
  expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute(
    'href',
    '/login'
  );
  expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
    'href',
    '/signup'
  );
});

test('redirects unauthenticated profile visits to sign in', async () => {
  window.history.pushState({}, '', '/profile');
  render(<App />);
  expect(
    await screen.findByRole('heading', { name: 'Sign in' })
  ).toBeInTheDocument();
});

test('signs in and shows the read-only account profile', async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole('link', { name: 'Sign in' }));

  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'a-test-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(
    await screen.findByRole('heading', { name: 'My Profile' })
  ).toBeInTheDocument();
  expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /save|update/i })).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/auth/login/',
    expect.objectContaining({
      headers: expect.objectContaining({ 'X-CSRFToken': 'test-csrf-token' }),
    })
  );
});

test('creates an account and opens the read-only profile', async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole('link', { name: 'Sign up' }));

  fireEvent.change(screen.getByLabelText('Full name'), {
    target: { value: 'Ada Lovelace' },
  });
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Phone number (optional)'), {
    target: { value: '555-0101' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'a-test-password' },
  });
  fireEvent.change(screen.getByLabelText('Confirm password'), {
    target: { value: 'a-test-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

  expect(
    await screen.findByRole('heading', { name: 'My Profile' })
  ).toBeInTheDocument();
  const signupRequest = global.fetch.mock.calls.find(([url]) =>
    String(url).includes('/auth/signup/')
  );
  expect(JSON.parse(signupRequest[1].body)).toMatchObject({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '555-0101',
    password: 'a-test-password',
    passwordConfirmation: 'a-test-password',
  });
});

test('sends chat with a CSRF token and renders the AI response', async () => {
  window.history.pushState({}, '', '/ai-assistant');
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /Bengali/ }));
  fireEvent.change(
    await screen.findByPlaceholderText('Ask PULSELINE a question...'),
    { target: { value: 'নমস্কার' } }
  );
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

  expect(await screen.findByText('বাংলায় উত্তর')).toBeInTheDocument();
  const chatRequest = global.fetch.mock.calls.find(([url]) =>
    String(url).includes('/ai-assistant/chat/')
  );
  expect(chatRequest[1].headers['X-CSRFToken']).toBe('test-csrf-token');
  expect(chatRequest[1].body.get('language')).toBe('bn-IN');
});

test('links the Home intelligence cards to their feature pages', async () => {
  render(<App />);
  await screen.findByRole('link', { name: 'Sign in' });

  expect(
    screen.getByRole('link', { name: 'Explore AI Intelligence Engine' })
  ).toHaveAttribute('href', '/ai-intelligence-engine');
  expect(
    screen.getByRole('link', { name: 'Explore Predictive Analytics' })
  ).toHaveAttribute('href', '/predictive-analytics');
  expect(
    screen.getByRole('link', { name: 'Explore Operational Insights' })
  ).toHaveAttribute('href', '/operational-insights');
  expect(
    screen.getByRole('link', { name: 'Explore Hospital Risk Monitor' })
  ).toHaveAttribute('href', '/hospital-risk-monitor');

  fireEvent.click(
    screen.getByRole('link', { name: 'Explore AI Intelligence Engine' })
  );
  expect(
    screen.getByRole('heading', { name: 'AI Intelligence Engine' })
  ).toBeInTheDocument();
});
