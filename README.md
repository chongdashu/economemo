# Economemo

An application to track what articles have been read on the economist.

[![CI](https://github.com/chongdashu/economemo/actions/workflows/ci.yml/badge.svg)](https://github.com/chongdashu/economemo/actions/workflows/ci.yml)

# Setup

## Fresh installation and configuration

In `root`
```
mamba create -n economemo python=3.11
mamba activate economemo
```

In `backend`
```
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy databases psycopg2-binary
pip freeze > requirements.txt
```

## Database

```
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-client
```

### WSL <> Windows

#### On Windows
1. Install Postgres@16 for Windows
2. Add Windows Firewall Custom Rule per [these instructions](https://stackoverflow.com/questions/56824788/how-to-connect-to-windows-postgres-database-from-wsl)

#### On WSL
1. Run `cat /etc/resolv.conf | grep nameserver | awk '{print $2}'` to get the IP of the Postgres Server


