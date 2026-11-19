#!/usr/bin/env bash

uvicorn sql_app.main:app --host 0.0.0.0 --port $PORT