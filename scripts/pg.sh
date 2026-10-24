#!/usr/bin/env bash
PG_CTL="./node_modules/@embedded-postgres/linux-x64/native/bin/pg_ctl"
DATA_DIR="./.local-db"
LOG_FILE="$DATA_DIR/logfile"

case "$1" in
  start)
    $PG_CTL -D "$DATA_DIR" -l "$LOG_FILE" start
    ;;
  stop)
    $PG_CTL -D "$DATA_DIR" stop
    ;;
  status)
    $PG_CTL -D "$DATA_DIR" status
    ;;
  restart)
    $PG_CTL -D "$DATA_DIR" -l "$LOG_FILE" restart
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
