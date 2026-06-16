#!/usr/bin/env python3
"""
Camelot-py sidecar script for PDF table extraction.

Usage:
    python3 scripts/table-extract.py <pdf_path> [--pages 1,3-5] [--flavor lattice|stream]

Reads a PDF, extracts tables using Camelot-py, and outputs JSON to stdout.
"""

import argparse
import json
import sys
import traceback


def parse_args():
    parser = argparse.ArgumentParser(description="Extract tables from PDF using Camelot-py")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--pages", default="1-end", help="Page range (e.g. 1,3-5, 1-end)")
    parser.add_argument("--flavor", default="lattice", choices=["lattice", "stream"],
                        help="Table extraction flavor")
    return parser.parse_args()


def parse_page_range(page_spec: str, total_pages: int) -> list[int]:
    if page_spec == "1-end":
        return list(range(1, total_pages + 1))

    pages: list[int] = []
    for part in page_spec.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            start = int(start.strip())
            end = int(end.strip()) if end.strip() != "end" else total_pages
            pages.extend(range(start, end + 1))
        else:
            pages.append(int(part))
    return sorted(set(pages))


def main():
    args = parse_args()

    try:
        import camelot
    except ImportError:
        print(json.dumps({"error": "Camelot-py not installed. Install with: pip install camelot-py[cv]"}))
        sys.exit(1)

    try:
        import fitz  # PyMuPDF
    except ImportError:
        print(json.dumps({"error": "PyMuPDF not installed. Install with: pip install PyMuPDF"}))
        sys.exit(1)

    try:
        doc = fitz.open(args.pdf_path)
        total_pages = doc.page_count
        doc.close()
    except Exception as e:
        print(json.dumps({"error": f"Cannot open PDF: {e}"}))
        sys.exit(1)

    pages = parse_page_range(args.pages, total_pages)

    all_tables: list[dict] = []
    page_str = ",".join(str(p) for p in pages)

    try:
        tables = camelot.read_pdf(
            args.pdf_path,
            pages=page_str,
            flavor=args.flavor,
        )
    except Exception as e:
        print(json.dumps({"error": f"Camelot extraction failed: {e}", "tables": []}))
        return

    for table in tables:
        cells = table.data
        headers = cells[0] if cells else []
        data_rows = cells[1:] if len(cells) > 1 else []

        all_tables.append({
            "page": table.parsing_report.get("page", 0),
            "accuracy": table.parsing_report.get("accuracy", 0),
            "headers": headers,
            "cells": data_rows,
        })

    output = {"tables": all_tables}
    print(json.dumps(output))


if __name__ == "__main__":
    main()
