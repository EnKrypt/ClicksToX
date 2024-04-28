#!/bin/bash

tsc
LIB=background-script vite build
LIB=content-script vite build
