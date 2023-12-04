const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const appleAuthConfig = {
  keyUrl: 'https://appleid.apple.com/auth/keys',
  clientId: process.env.APPLE_CLIENT_ID,
};

const client = jwksClient({
  jwksUri: appleAuthConfig.keyUrl,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

exports.handler = async function (event, context) {
  console.log('Received event:', event); // Log the received event

  if (event.httpMethod !== 'POST') {
    return {statusCode: 405, body: 'Method Not Allowed'};
  }

  try {
    const {identityToken} = JSON.parse(event.body);
    console.log('Received identityToken:', identityToken); // Log the received token

    const decodedToken = await new Promise((resolve, reject) => {
      jwt.verify(
        identityToken,
        getKey,
        {algorithms: ['RS256']},
        (err, decoded) => {
          if (err) {
            console.error('JWT verification error:', err); // Log any errors
            reject(err);
          } else {
            console.log('Decoded JWT:', decoded); // Log the decoded JWT
            resolve(decoded);
          }
        },
      );
    });

    return {
      statusCode: 200,
      body: JSON.stringify({success: true, user: {id: decodedToken.userId}}),
    };
  } catch (error) {
    console.error('Server error:', error); // Log any server errors
    return {
      statusCode: 500,
      body: JSON.stringify({success: false, message: 'Internal server error'}),
    };
  }
};
