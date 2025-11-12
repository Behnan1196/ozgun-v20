import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    try {
      const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICES_JSON || '{}')
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      })
      
      console.log('✅ Firebase Admin initialized')
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error)
      throw error
    }
  }
  
  return getMessaging()
}

export { initializeFirebaseAdmin }