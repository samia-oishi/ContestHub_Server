# ContestHub Server

This is the backend part of my ContestHub project. It handles the database, user roles, contests, payments, submissions, and winner result system.

Live server link: add after deployment  
Client link: add after deployment  
Server repo: add GitHub link  
Client repo: add GitHub link  

## Main Features

- User data saved in MongoDB
- JWT token system for private routes
- Admin, creator, and user role checking
- Contest add, update, approve, reject, and delete
- Stripe payment verification
- Contest registration after successful payment
- Task submission system
- Creator can declare winner after deadline
- User participated and winning contest data
- Profile update API
- Leaderboard and recent winner API
- Admin can update user roles

## Used Packages / Tools

Node.js, Express.js, MongoDB, JWT, Stripe, Cookie Parser, CORS, and dotenv.

## Environment Variables

Create a `.env` file and add these:

```env
PORT=5000
MONGODB_URI=
DB_NAME=contesthub
JWT_SECRET=
CLIENT_ORIGIN=http://localhost:5173
STRIPE_SECRET_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NODE_ENV=development
```

## Run Locally

```bash
npm install
npm run dev
```

Local server link:

```txt
http://localhost:5000
```

Health check:

```txt
http://localhost:5000/health
```

## Deployment

I will deploy this backend on Vercel. MongoDB URI, JWT secret, Stripe secret key, Firebase admin keys, and client URL need to be added in Vercel environment variables.
