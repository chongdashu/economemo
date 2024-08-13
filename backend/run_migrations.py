import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv


def get_wsl_ip():
    try:
        with open("/proc/version", "r") as f:
            if "microsoft" in f.read().lower():
                result = subprocess.run(["cat", "/etc/resolv.conf"], capture_output=True, text=True)
                for line in result.stdout.splitlines():
                    if line.startswith("nameserver"):
                        return line.split()[1]
    except FileNotFoundError:
        pass
    return None


def setup_environment():
    load_dotenv()
    wsl_ip = get_wsl_ip()
    if wsl_ip:
        os.environ["POSTGRES_HOST"] = wsl_ip


def run_alembic(args):
    command = [sys.executable, "-m", "alembic"] + args
    result = subprocess.run(command, capture_output=True, text=True)
    print(result.stdout)
    print(result.stderr, file=sys.stderr)
    return result.returncode


if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    setup_environment()
    exit_code = run_alembic(sys.argv[1:] if len(sys.argv) > 1 else ["upgrade", "head"])
    sys.exit(exit_code)
