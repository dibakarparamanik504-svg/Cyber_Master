# Hack-the day

## Appointment backend

The appointment page uses Django REST Framework with SQLite. To run it locally:

1. In `backend`, run `python -m pip install -r requirements.txt`.
2. Run `python manage.py migrate`.
3. Run `python manage.py createsuperuser` to manage official hospital content and queue statuses.
4. Run `python manage.py runserver 127.0.0.1:8000`.
5. In a separate terminal, run `npm start` from `frontend`.

The frontend development server proxies `/api/` requests to Django. Open the exact
frontend URL printed by `npm start`; if another app already uses port 3000, CRA
may start on port 3001. Restart CRA after changing its proxy configuration.
Appointments are scoped to the browser session; confirmed time slots are shared across sessions.
Appointment booking issues a queue token and session-scoped verification code;
staff can update queue status in Django Admin.

Hospital profile, department, specialist, facility, and official notice records are
staff-managed in Django Admin. Public notice submissions are saved as private drafts;
only staff can publish them. The initial department and facility directory is
illustrative and unverified. Feedback is available only to authorized staff.

Queue dashboards use appointment records. Wait-time estimates remain unavailable
until real check-in and service-time measurements are collected. Infrastructure
monitoring and predictive hardware metrics remain unconfigured until real sources
are connected.

## Gemini AI assistant

The AI Assistant sends chat messages and supported JPG, PNG, WEBP, PDF, or TXT
attachments to the Django backend. The backend calls Gemini; the API key is never
sent to the browser.

1. Copy `backend/.env.example` to `backend/.env` if needed and set
   `GEMINI_API_KEY` to your Gemini API key. Keep `.env` private and never commit it.
2. `GEMINI_MODEL` defaults to `gemini-3.8-flash`; if it returns 404 or 503, the
   backend falls back to `GEMINI_FALLBACK_MODEL` (`gemini-3.5-flash-lite`).
   Set `GEMINI_FALLBACK_MODEL` to an available model or an empty value to disable
   the fallback.
3. Install backend requirements and run `python manage.py migrate`, then start
   Django with `python manage.py runserver 127.0.0.1:8000`.
4. Run the frontend with `npm start` and open the URL printed in the terminal.
   For production, configure the web server to proxy `/api/` to Django or set
   `REACT_APP_API_URL` to the backend API base URL before building.

The assistant supports the UI's English, Bengali, Hindi, Odia, Tamil, and Telugu
choices. Conversation context is limited to the latest six exchanges and is
session-scoped; conversations inactive for 24 hours are pruned on the next chat
request. Do not send emergency requests or rely on AI output as a medical diagnosis
or prescription.

