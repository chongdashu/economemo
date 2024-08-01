## Setup Environment Variables

Create a `.env` file with the following set.

```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_HOST=

# Supabase Configuration
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend Configuration
RESEND_API_KEY=re_CXsNdhJr_2PgnKDWVKKfqUPqxxvjgKQVM
```

You can create debug SSL certs

```
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```
