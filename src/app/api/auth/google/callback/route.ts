import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Check if there was an error in the OAuth flow
  if (error) {
    return getHtmlResponse({
      type: 'GOOGLE_AUTH_ERROR',
      error: 'Google authentication was denied or failed'
    });
  }

  // Check if the authorization code is present
  if (!code) {
    return getHtmlResponse({
      type: 'GOOGLE_AUTH_ERROR',
      error: 'Authorization code is missing'
    });
  }

  try {
    // Validate required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Missing Google OAuth credentials');
      return getHtmlResponse({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'OAuth configuration error'
      });
    }

    // Construct redirect URI with proper protocol
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    console.log('OAuth redirect URI:', redirectUri);

    // Initialize OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Exchange the authorization code for tokens
    const tokenResponse = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokenResponse.tokens);

    // Get the ID token from the tokens
    const idToken = tokenResponse.tokens.id_token;

    if (!idToken) {
      return getHtmlResponse({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'ID token not received from Google'
      });
    }

    // Return HTML with the ID token in a message to parent window
    return getHtmlResponse({
      type: 'GOOGLE_AUTH_SUCCESS',
      credential: idToken
    });

  } catch (error) {
    console.error('Google callback error:', error);
    return getHtmlResponse({
      type: 'GOOGLE_AUTH_ERROR',
      error: 'Failed to authenticate with Google'
    });
  }
}

// Helper function to generate HTML response that posts a message to the opener window
type GoogleMessageData = {
  type: 'GOOGLE_AUTH_SUCCESS' | 'GOOGLE_AUTH_ERROR' | string;
  credential?: string;
  error?: string;
}

function getHtmlResponse(messageData: GoogleMessageData): NextResponse {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Authentication</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 20px;
          }
          .success { color: #38A169; }
          .error { color: #E53E3E; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 class="${messageData.type.includes('ERROR') ? 'error' : 'success'}">
            ${messageData.type.includes('ERROR') ? 'Authentication Failed' : 'Authentication Successful'}
          </h2>
          <p>You can close this window now.</p>
        </div>
        <script>
          // Send message to parent window
          window.opener.postMessage(${JSON.stringify(messageData)}, window.location.origin);
          
          // Close the window after a short delay
          setTimeout(function() {
            window.close();
          }, 1000);
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}