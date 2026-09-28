# EcoCampus free deployment

This project is ready to be published in a free setup using:

- Frontend: Netlify
- Backend: Render
- Database: Railway

## 1. Deploy the database on Railway

1. Open https://railway.app
2. Create a new project
3. Add MySQL
4. Copy the database connection values

## 2. Deploy the backend on Render

### Option A: Use the included Render config

Push this repo to GitHub, then create a new Render Web Service and select the repository.

Set:
- Root Directory: `EcoCampus/backend`
- Build Command: `npm install`
- Start Command: `npm start`

Add environment variables:

```env
PORT=10000
DB_HOST=your_railway_host
DB_USER=your_railway_user
DB_PASSWORD=your_railway_password
DB_NAME=your_railway_database_name
```

Render will publish a URL like:

```text
https://ecocampus-api.onrender.com
```

Then set the frontend API URL to that value in the browser by defining `window.ECOCAMPUS_API_URL` before the app scripts load, or by updating the default API values in the frontend files.

## 3. Deploy the frontend on Netlify

1. Open https://netlify.com
2. Upload the `EcoCampus/frontend` folder
3. Publish site

Your frontend URL will look like:

```text
https://your-app-name.netlify.app
```

## 4. Final app URL behavior

- Frontend: Netlify URL
- Backend API: Render URL + `/api`
- Database: Railway managed MySQL

Example app endpoints:

```text
https://your-app-name.netlify.app/login.html
https://ecocampus-api.onrender.com/api/auth/login
```

## Default admin login

```text
email: admin@ecocampus.com
password: admin123
```

## Default user login

```text
email: user@ecocampus.com
password: user123
```
