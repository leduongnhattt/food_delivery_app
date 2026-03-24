import { NextResponse } from 'next/server';

export async function GET() {
  // Validate required environment variables
  if (!process.env.GOOGLE_CLIENT_ID) {
    return new NextResponse('Google OAuth not configured', { status: 500 });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const googleOAuthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleOAuthURL.searchParams.append('client_id', googleClientId || '');
  googleOAuthURL.searchParams.append('redirect_uri', redirectUri);
  googleOAuthURL.searchParams.append('response_type', 'code');
  googleOAuthURL.searchParams.append('scope', 'email profile');
  googleOAuthURL.searchParams.append('prompt', 'select_account');
  googleOAuthURL.searchParams.append('access_type', 'offline');

  // HTML for the popup window
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Authentication</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
            color: #333;
          }
          .container {
            text-align: center;
            padding: 20px;
          }
          .loader {
            border: 4px solid #f3f3f3;
            border-radius: 50%;
            border-top: 4px solid #E53E3E;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .button {
            background-color: #E53E3E;
            color: white;
            border: none;
            padding: 12px 24px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #C53030;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <a class="button" href="${googleOAuthURL.toString()}" id="loginBtn">
            Connecting to Google...
          </a>
        </div>
        <script>
          // Auto-click the button after a short delay
          setTimeout(function() {
            document.getElementById('loginBtn').click();
          }, 500);
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}