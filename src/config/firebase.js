import admin from 'firebase-admin'

function buildCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
    }

    return admin.credential.cert(serviceAccount)
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  }

  return undefined
}

export function getFirebaseAuth() {
  if (!admin.apps.length) {
    const credential = buildCredential()
    const options = {
      projectId: process.env.FIREBASE_PROJECT_ID,
    }

    if (credential) {
      options.credential = credential
    }

    admin.initializeApp(options)
  }

  return admin.auth()
}
